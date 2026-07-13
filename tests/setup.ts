import { Request, Response, NextFunction } from 'express';

// Mock pg module
jest.mock('pg', () => {
  const mockQuery = jest.fn((sql: string, params: any, cb: any) => {
    console.log('mockQuery called with SQL:', sql);
    const callback = typeof params === 'function' ? params : typeof cb === 'function' ? cb : null;
    const result = { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    if (callback) {
      callback(null, result);
    }
    return Promise.resolve(result);
  });

  const mClient = {
    query: mockQuery,
    release: jest.fn(),
  };
  const mPool = {
    connect: jest.fn((cb) => {
      if (cb) cb(null, mClient, () => {});
      return Promise.resolve(mClient);
    }),
    query: mockQuery,
    on: jest.fn(),
    end: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mPool),
    default: {
      Pool: jest.fn(() => mPool),
    },
    types: {
      setTypeParser: jest.fn(),
    },
  };
});

// Mock redis module (v5.12.1)
jest.mock('redis', () => {
  const mClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn().mockImplementation(function (event: string, cb: any) {
      if (event === 'connect' || event === 'ready') {
        // Trigger connect/ready callbacks to set connected = true
        setTimeout(cb, 0);
      }
      return mClient;
    }),
    hGet: jest.fn().mockResolvedValue(null),
    hGetAll: jest.fn().mockResolvedValue({}),
    hSet: jest.fn().mockResolvedValue(1),
    hDel: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  };
  return {
    createClient: jest.fn(() => mClient),
  };
});


// Set default env vars for testing
process.env.NODE_ENV = 'test';
process.env.JWT_KEY = 'test-jwt-key';
process.env.JWT_REFRESH_KEY = 'test-jwt-refresh-key';
process.env.DB_NAME = 'chatbot_test';
