import {
  isEmpty,
  isNumeric,
  isJson,
  isDomainAddress,
  randomString,
  maskSensitiveData,
  excelColumnName,
  safeJsonParse
} from '../../src/helpers/value';

describe('Value Helper Tests', () => {
  describe('isEmpty', () => {
    test('should return true for empty values', () => {
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty(0)).toBe(true);
      expect(isEmpty(-5)).toBe(true);
    });

    test('should return false for non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(1)).toBe(false);
      expect(isEmpty(100)).toBe(false);
    });
  });

  describe('isNumeric', () => {
    test('should return true for numeric values', () => {
      expect(isNumeric(123)).toBe(true);
      expect(isNumeric('123')).toBe(true);
      expect(isNumeric(1.23)).toBe(true);
      expect(isNumeric('1.23')).toBe(true);
      expect(isNumeric('0')).toBe(true);
    });

    test('should return false for non-numeric values', () => {
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric(NaN)).toBe(false);
      expect(isNumeric(Infinity)).toBe(false);
      expect(isNumeric(undefined)).toBe(false);
      expect(isNumeric(null)).toBe(false);
      expect(isNumeric({})).toBe(false);
    });
  });

  describe('isJson', () => {
    test('should return parsed object for valid JSON string', () => {
      const jsonStr = '{"name":"John","age":30}';
      expect(isJson(jsonStr)).toEqual({ name: 'John', age: 30 });
    });

    test('should return object directly if object is passed and is valid/non-empty', () => {
      const obj = { name: 'John', age: 30 };
      expect(isJson(obj)).toEqual(obj);
    });

    test('should return false for invalid JSON string', () => {
      const invalidJson = '{"name":"John",age:30}';
      expect(isJson(invalidJson)).toBe(false);
    });

    test('should return false for empty object or string', () => {
      expect(isJson('{}')).toBe(false);
      expect(isJson('')).toBe(false);
      expect(isJson(null)).toBe(false);
    });
  });

  describe('isDomainAddress', () => {
    test('should return true for valid domain name', () => {
      expect(isDomainAddress('google.com')).toBe(true);
      expect(isDomainAddress('api.chatbot.co.id')).toBe(true);
    });

    test('should return false for localhost or IP addresses', () => {
      expect(isDomainAddress('localhost')).toBe(false);
      expect(isDomainAddress('127.0.0.1')).toBe(false);
      expect(isDomainAddress('192.168.1.1')).toBe(false);
    });
  });

  describe('randomString', () => {
    test('should return random string of default size 32', () => {
      const str = randomString();
      expect(str.length).toBe(32);
    });

    test('should return random string of specific size', () => {
      const str = randomString(10);
      expect(str.length).toBe(10);
    });

    test('should only contain letters if numeric and specialchar are false', () => {
      const str = randomString(100, false, false);
      expect(/^[A-Za-z]+$/.test(str)).toBe(true);
    });

    test('should contain numbers if numeric option is true', () => {
      const str = randomString(1000, true, false);
      expect(/[0-9]/.test(str)).toBe(true);
    });

    test('should contain special chars if specialchar option is true', () => {
      const str = randomString(1000, false, true);
      expect(/[!@#$&]/.test(str)).toBe(true);
    });
  });

  describe('maskSensitiveData', () => {
    test('should mask password and secret fields', () => {
      const data = {
        username: 'admin',
        password: 'myPassword123',
        secret: 'mySecretKey',
        otherField: 'keepThis'
      };

      const masked = maskSensitiveData({ ...data });
      expect(masked.username).toBe('admin');
      expect(masked.password).toBe('*************');
      expect(masked.secret).toBe('***********');
      expect(masked.otherField).toBe('keepThis');
    });

    test('should be case insensitive for keys', () => {
      const data = {
        PASSWORD: 'test',
        SeCrEt: 'key'
      };

      const masked = maskSensitiveData({ ...data });
      expect(masked.PASSWORD).toBe('****');
      expect(masked.SeCrEt).toBe('***');
    });
  });

  describe('excelColumnName', () => {
    test('should convert index numbers to alphabetical Excel column names', () => {
      expect(excelColumnName(1)).toBe('A');
      expect(excelColumnName(2)).toBe('B');
      expect(excelColumnName(26)).toBe('Z');
      expect(excelColumnName(27)).toBe('AA');
      expect(excelColumnName(28)).toBe('AB');
      expect(excelColumnName(702)).toBe('ZZ');
      expect(excelColumnName(703)).toBe('AAA');
    });
  });

  describe('safeJsonParse', () => {
    test('should parse valid JSON strings to objects', () => {
      expect(safeJsonParse('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
    });

    test('should parse nested JSON strings recursively', () => {
      expect(safeJsonParse('{"nested":"{\\"x\\":1}"}')).toEqual({ nested: { x: 1 } });
    });

    test('should parse elements inside array inputs recursively', () => {
      expect(safeJsonParse(['{"name":"John"}', 'simple-string', '123'])).toEqual([
        { name: 'John' },
        'simple-string',
        123
      ]);
    });

    test('should parse properties of object inputs recursively', () => {
      expect(safeJsonParse({
        field1: '{"name":"John"}',
        field2: 'simple-string',
        field3: '123'
      })).toEqual({
        field1: { name: 'John' },
        field2: 'simple-string',
        field3: 123
      });
    });

    test('should return raw string if parsing fails', () => {
      expect(safeJsonParse('invalid-json')).toBe('invalid-json');
    });

    test('should handle numbers and booleans correctly without infinite recursion', () => {
      expect(safeJsonParse('123')).toBe(123);
      expect(safeJsonParse(123)).toBe(123);
      expect(safeJsonParse('true')).toBe(true);
      expect(safeJsonParse(true)).toBe(true);
      expect(safeJsonParse(null)).toBeNull();
    });
  });
});
