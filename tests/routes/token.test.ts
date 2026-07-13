import request from 'supertest';
import express from 'express';

import router from '../../src/routes/token';
import * as controller from '../../src/controllers/token';

jest.mock('../../src/controllers/token');
jest.mock('../../src/middleware/auth', () => ({
  __esModule: true,
  authenticateRefreshToken: jest.fn((req: any, res: any, next: any) => next())
}));
jest.mock('../../src/middleware/validation', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Token Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/token', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST / should call auth', async () => {
    (controller.auth as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).post('/token').send({ username: 'user', password: 'pwd' });
    expect(response.status).toBe(200);
    expect(controller.auth).toHaveBeenCalled();
  });

  it('GET /refresh should call refreshAuth', async () => {
    (controller.refreshAuth as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/token/refresh');
    expect(response.status).toBe(200);
    expect(controller.refreshAuth).toHaveBeenCalled();
  });
});
