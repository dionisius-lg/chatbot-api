import { Response } from 'express';
import {
  sendSuccess,
  sendSuccessCreated,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendNotFoundData,
  sendMethodNotAllowed,
  sendTooManyRequests,
  sendInternalServerError
} from '../../src/helpers/response';

describe('Response Helper Tests', () => {
  let mockResponse: Partial<Response>;
  let sendMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest.fn();
    statusMock = jest.fn().mockImplementation(() => mockResponse);
    mockResponse = {
      status: statusMock,
      send: sendMock
    };
  });

  test('sendSuccess should set status to 200 and send payload', () => {
    const payload = { message: 'success' };
    sendSuccess(mockResponse as Response, payload);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(sendMock).toHaveBeenCalledWith(payload);
  });

  test('sendSuccess should inject paging when all paging properties exist', () => {
    const payload = {
      total_data: 10,
      data: [1, 2, 3],
      limit: 3,
      page: 1
    };
    sendSuccess(mockResponse as Response, payload);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(sendMock).toHaveBeenCalledWith({
      total_data: 10,
      data: [1, 2, 3],
      paging: {
        current: 1,
        previous: 1,
        next: 2,
        first: 1,
        last: 4
      }
    });
  });

  test('sendSuccessCreated should set status to 201 and send payload', () => {
    const payload = { id: 1 };
    sendSuccessCreated(mockResponse as Response, payload);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(sendMock).toHaveBeenCalledWith(payload);
  });

  test('sendBadRequest should set status to 400 and send error message', () => {
    sendBadRequest(mockResponse as Response, 'Bad Input');
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(sendMock).toHaveBeenCalledWith({ error: 'Bad Input' });
  });

  test('sendBadRequest should send default message if none is provided', () => {
    sendBadRequest(mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(sendMock).toHaveBeenCalledWith({ error: 'Request is invalid' });
  });

  test('sendUnauthorized should set status to 401', () => {
    sendUnauthorized(mockResponse as Response, 'No Token');
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith({ error: 'No Token' });
  });

  test('sendForbidden should set status to 403', () => {
    sendForbidden(mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(sendMock).toHaveBeenCalledWith({ error: 'You do not have rights to access this resource' });
  });

  test('sendNotFound should set status to 404', () => {
    sendNotFound(mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(sendMock).toHaveBeenCalledWith({ error: 'Resource not found' });
  });

  test('sendNotFoundData should set status to 404', () => {
    sendNotFoundData(mockResponse as Response, 'Item not found');
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(sendMock).toHaveBeenCalledWith({ error: 'Item not found' });
  });

  test('sendMethodNotAllowed should set status to 405', () => {
    sendMethodNotAllowed(mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(405);
    expect(sendMock).toHaveBeenCalledWith({ error: 'This resource is not match with your request method' });
  });

  test('sendTooManyRequests should set status to 429', () => {
    sendTooManyRequests(mockResponse as Response, 'Rate Limit');
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(sendMock).toHaveBeenCalledWith({ error: 'Rate Limit' });
  });

  test('sendInternalServerError should set status to 500', () => {
    sendInternalServerError(mockResponse as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(sendMock).toHaveBeenCalledWith({ error: 'The server encountered an error, please try again later' });
  });
});
