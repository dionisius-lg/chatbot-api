import {
  getData,
  getDataQuery,
  setData,
  setMultiData,
  setDataQuery,
  deleteData,
  deleteDataQuery
} from '../../src/helpers/cache';
import * as cache from '../../src/config/cache';

const mockConnected = { value: true };

// Mock the cache configuration module to avoid real Redis connection in tests
jest.mock('../../src/config/cache', () => {
  return {
    get connected() {
      return mockConnected.value;
    },
    expire: 3600,
    client: {
      hGet: jest.fn(),
      hGetAll: jest.fn(),
      hSet: jest.fn(),
      hDel: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    },
  };
});

describe('Cache Helper Tests', () => {
  const mockClient = cache.client as jest.Mocked<typeof cache.client>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnected.value = true;
  });

  describe('getData', () => {
    test('should return null if cache is not connected', async () => {
      mockConnected.value = false;
      const res = await getData('my-key', 'my-field');
      expect(res).toBeNull();
    });

    test('should return null if key is empty', async () => {
      const res = await getData('', 'my-field');
      expect(res).toBeNull();
    });

    test('should call hGet and parse JSON value when field is specified', async () => {
      mockClient.hGet.mockResolvedValueOnce('{"foo":"bar"}');
      const res = await getData('my-key', 'my-field');
      expect(mockClient.hGet).toHaveBeenCalledWith('my-key', 'my-field');
      expect(res).toEqual({ foo: 'bar' });
    });

    test('should return null if hGet returns null or string "null"', async () => {
      mockClient.hGet.mockResolvedValueOnce(null);
      const res1 = await getData('my-key', 'my-field');
      expect(res1).toBeNull();

      mockClient.hGet.mockResolvedValueOnce('null');
      const res2 = await getData('my-key', 'my-field');
      expect(res2).toBeNull();
    });

    test('should call hGetAll and return parsed fields when field is empty', async () => {
      mockClient.hGetAll.mockResolvedValueOnce({
        field1: '{"name":"John"}',
        field2: 'simple-string'
      });

      const res = await getData('my-key');
      expect(mockClient.hGetAll).toHaveBeenCalledWith('my-key');
      expect(res).toEqual({
        field1: { name: 'John' },
        field2: 'simple-string'
      });
    });

    test('should return null if hGetAll returns empty object', async () => {
      mockClient.hGetAll.mockResolvedValueOnce({});
      const res = await getData('my-key');
      expect(res).toBeNull();
    });
  });

  describe('getDataQuery', () => {
    test('should throw error if cache is not connected', async () => {
      mockConnected.value = false;
      await expect(getDataQuery('my-key', 'select *')).rejects.toThrow('Connection lost');
    });

    test('should fetch and return JSON-parsed query result', async () => {
      mockClient.hGet.mockResolvedValueOnce('{"data":[1,2,3]}');
      const res = await getDataQuery('my-key', 'select *');
      expect(mockClient.hGet).toHaveBeenCalled();
      expect(res).toEqual({ data: [1, 2, 3] });
    });

    test('should return plain text if result is not valid JSON', async () => {
      mockClient.hGet.mockResolvedValueOnce('plain-text-response');
      const res = await getDataQuery('my-key', 'select *');
      expect(res).toBe('plain-text-response');
    });
  });

  describe('setData', () => {
    test('should return null if cache is not connected', async () => {
      mockConnected.value = false;
      const res = await setData('my-key', 'my-field', 'my-val');
      expect(res).toBeNull();
    });

    test('should throw error/return null on invalid input', async () => {
      const res1 = await setData('', 'my-field', 'my-val');
      expect(res1).toBeNull();

      const res2 = await setData('my-key', '', 'my-val');
      expect(res2).toBeNull();

      const res3 = await setData('my-key', 'my-field', '');
      expect(res3).toBeNull();
    });

    test('should serialize object values and call hSet', async () => {
      mockClient.hSet.mockResolvedValueOnce(1);
      const res = await setData('my-key', 'my-field', { success: true });
      expect(mockClient.hSet).toHaveBeenCalledWith('my-key', 'my-field', '{"success":true}');
      expect(res).toBe(1);
    });

    test('should handle boolean values without serialization', async () => {
      mockClient.hSet.mockResolvedValueOnce(1);
      await setData('my-key', 'my-field', true);
      expect(mockClient.hSet).toHaveBeenCalledWith('my-key', 'my-field', 'true');
    });

    test('should call expire if positive expire value is passed', async () => {
      mockClient.hSet.mockResolvedValueOnce(1);
      await setData('my-key', 'my-field', 'my-val', 120);
      expect(mockClient.expire).toHaveBeenCalledWith('my-key', 120);
    });
  });

  describe('setMultiData', () => {
    test('should return null if cache is not connected', async () => {
      mockConnected.value = false;
      const res = await setMultiData('my-key', { field1: 'val1' });
      expect(res).toBeNull();
    });

    test('should return null if key or data is empty', async () => {
      const res1 = await setMultiData('', { field1: 'val1' });
      expect(res1).toBeNull();

      const res2 = await setMultiData('my-key', {});
      expect(res2).toBeNull();
    });

    test('should serialize and set multiple fields', async () => {
      mockClient.hSet.mockResolvedValueOnce(2);
      const data = {
        name: 'John',
        age: 30,
        isAdmin: true,
        meta: { location: 'ID' }
      };

      const res = await setMultiData('my-key', data, 60);
      expect(mockClient.hSet).toHaveBeenCalledWith('my-key', {
        name: 'John',
        age: '30',
        isAdmin: 'true',
        meta: '{"location":"ID"}'
      });
      expect(mockClient.expire).toHaveBeenCalledWith('my-key', 60);
      expect(res).toBe(2);
    });
  });

  describe('setDataQuery', () => {
    test('should return null if cache is not connected', async () => {
      mockConnected.value = false;
      const res = await setDataQuery('my-key', 'query', 'val');
      expect(res).toBeNull();
    });

    test('should store query hash values prefixed with query:', async () => {
      mockClient.hSet.mockResolvedValueOnce(1);
      const res = await setDataQuery('user-list', 'SELECT * FROM users', { list: [] }, 500);
      expect(mockClient.hSet).toHaveBeenCalledWith('query:user-list', expect.any(String), '{"list":[]}');
      expect(mockClient.expire).toHaveBeenCalledWith('query:user-list', 500);
      expect(res).toBe(1);
    });
  });

  describe('deleteData', () => {
    test('should return null if cache is not connected', async () => {
      mockConnected.value = false;
      const res = await deleteData('my-key');
      expect(res).toBeNull();
    });

    test('should return null if key is empty', async () => {
      const res = await deleteData('');
      expect(res).toBeNull();
    });

    test('should call hDel if field is specified', async () => {
      mockClient.hDel.mockResolvedValueOnce(1);
      const res = await deleteData('my-key', 'my-field');
      expect(mockClient.hDel).toHaveBeenCalledWith('my-key', 'my-field');
      expect(res).toBe(1);
    });

    test('should call del if field is not specified', async () => {
      mockClient.del.mockResolvedValueOnce(1);
      const res = await deleteData('my-key');
      expect(mockClient.del).toHaveBeenCalledWith('my-key');
      expect(res).toBe(1);
    });
  });

  describe('deleteDataQuery', () => {
    test('should return null if cache is not connected', async () => {
      mockConnected.value = false;
      const res = await deleteDataQuery('my-key');
      expect(res).toBeNull();
    });

    test('should return null if key is empty', async () => {
      const res = await deleteDataQuery('');
      expect(res).toBeNull();
    });

    test('should delete single query key prefixed with query:', async () => {
      mockClient.del.mockResolvedValueOnce(1);
      const res = await deleteDataQuery('my-key');
      expect(mockClient.del).toHaveBeenCalledWith(['query:my-key']);
      expect(res).toBe(1);
    });

    test('should delete multiple query keys prefixed with query:', async () => {
      mockClient.del.mockResolvedValueOnce(2);
      const res = await deleteDataQuery(['key1', 'key2']);
      expect(mockClient.del).toHaveBeenCalledWith(['query:key1', 'query:key2']);
      expect(res).toBe(2);
    });
  });
});
