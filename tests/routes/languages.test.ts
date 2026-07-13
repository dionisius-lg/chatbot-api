import request from 'supertest';
import express from 'express';

import router from '../../src/routes/languages';
import * as controller from '../../src/controllers/languages';

jest.mock('../../src/controllers/languages');
jest.mock('../../src/middleware/auth', () => ({
  __esModule: true,
  authenticateToken: jest.fn((req: any, res: any, next: any) => next())
}));
jest.mock('../../src/middleware/validation', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Languages Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/languages', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET / should call getData', async () => {
    (controller.getData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/languages');
    expect(response.status).toBe(200);
    expect(controller.getData).toHaveBeenCalled();
  });

  it('GET /:id should call getDataById', async () => {
    (controller.getDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/languages/1');
    expect(response.status).toBe(200);
    expect(controller.getDataById).toHaveBeenCalled();
  });
});
