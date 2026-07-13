jest.mock('../../src/config', () => ({
  __esModule: true,
  default: {
    timezone: 'Asia/Jakarta',
    jwt: {
      key: 'test_access_key',
      expire: '1h',
      refresh_key: 'test_refresh_key',
      refresh_expire: '7d',
      algorithm: 'HS256'
    }
  }
}));

import { create, createRefresh } from '../../src/helpers/token';

describe('Token Helper Tests', () => {
  const payload = {
    user_id: 1,
    user_agent: 'jest-agent',
    ip_address: '127.0.0.1'
  };

  test('should create a valid JWT access token', async () => {
    const result = await create(payload);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.expire).toBeDefined();
    expect(typeof result.expire).toBe('string');
  });

  test('should create a valid JWT refresh token', async () => {
    const result = await createRefresh(payload);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.expire).toBeDefined();
    expect(typeof result.expire).toBe('string');
  });
});
