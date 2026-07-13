import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, authenticateRefreshToken, authenticateKey } from '../../src/middleware/auth';
import * as fileHelper from '../../src/helpers/file';

jest.mock('jsonwebtoken');
jest.mock('../../src/helpers/file');
jest.mock('../../src/config', () => ({
  __esModule: true,
  default: {
    jwt: {
      key: 'access-key',
      refresh_key: 'refresh-key',
      algorithm: 'HS256'
    }
  }
}));

describe('Auth Middleware Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  let sendMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest.fn();
    statusMock = jest.fn().mockImplementation(() => mockResponse);
    mockResponse = {
      status: statusMock,
      send: sendMock
    };
    nextFunction = jest.fn();
  });

  describe('authenticateToken', () => {
    test('should call next if token is valid', () => {
      mockRequest = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, options, callback) => {
        callback(null, { user_id: 1, user_agent: 'jest', ip_address: '127.0.0.1' });
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalled();
      expect(mockRequest.decoded).toEqual({ user_id: 1, user_agent: 'jest', ip_address: '127.0.0.1' });
      expect(nextFunction).toHaveBeenCalled();
    });

    test('should return 401 if token is invalid/expired', () => {
      mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, options, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith({ error: 'You do not have rights to access this resource' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test('should return 403 if authorization header is missing or not Bearer', () => {
      mockRequest = {
        headers: {}
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authenticateRefreshToken', () => {
    test('should call next if refresh token is valid', () => {
      mockRequest = {
        headers: {
          authorization: 'Bearer valid-refresh-token'
        }
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, options, callback) => {
        callback(null, { user_id: 1, user_agent: 'jest', ip_address: '127.0.0.1' });
      });

      authenticateRefreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authenticateKey', () => {
    test('should call next if x-api-key matches key.txt content', () => {
      mockRequest = {
        headers: {
          'x-api-key': 'valid-api-key'
        }
      };

      (fileHelper.getContent as jest.Mock).mockReturnValue('valid-api-key');

      authenticateKey(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    test('should return 401 if x-api-key does not match', () => {
      mockRequest = {
        headers: {
          'x-api-key': 'wrong-api-key'
        }
      };

      (fileHelper.getContent as jest.Mock).mockReturnValue('valid-api-key');

      authenticateKey(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith({ error: 'API key not valid' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test('should return 403 if x-api-key is missing', () => {
      mockRequest = {
        headers: {}
      };

      authenticateKey(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
