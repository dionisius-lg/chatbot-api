import { filterColumn, filterData, filterParam } from '../../src/helpers/request';

describe('Request Helper Tests', () => {
  describe('filterColumn', () => {
    test('should remove keys not present in the allowed list', () => {
      const obj = { id: 1, name: 'John', age: 30, password: 'hash' };
      const allowedKeys = ['id', 'name'];

      filterColumn(obj, allowedKeys);

      expect(obj).toEqual({ id: 1, name: 'John' });
      expect((obj as any).age).toBeUndefined();
      expect((obj as any).password).toBeUndefined();
    });

    test('should handle empty object or keys', () => {
      const obj = {};
      filterColumn(obj, ['id']);
      expect(obj).toEqual({});

      const obj2 = { id: 1 };
      filterColumn(obj2, []);
      expect(obj2).toEqual({});
    });
  });

  describe('filterData', () => {
    test('should delete keys with undefined values', () => {
      const obj = {
        id: 1,
        active: false,
        name: undefined,
        status: 'ok'
      };

      filterData(obj);

      expect(obj).toEqual({ id: 1, active: false, status: 'ok' });
    });

    test('should convert empty strings to null', () => {
      const obj = {
        name: '  ',
        desc: '',
        content: 'hello'
      };

      filterData(obj);

      expect(obj).toEqual({
        name: null,
        desc: null,
        content: 'hello'
      });
    });
  });

  describe('filterParam', () => {
    test('should return a new object containing only specified params', () => {
      const obj = {
        page: 1,
        limit: 10,
        order: 'desc',
        search: 'keyword'
      };

      const result = filterParam(obj, ['page', 'limit']);

      expect(result).toEqual({ page: 1, limit: 10 });
      expect(result).not.toBe(obj); // check that it is a new object
    });
  });
});
