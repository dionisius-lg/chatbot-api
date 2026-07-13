import request from 'supertest';
import express from 'express';

import router from '../../src/routes/users';
import * as controller from '../../src/controllers/users';

jest.mock('../../src/controllers/users');
jest.mock('../../src/middleware/auth', () => ({
  __esModule: true,
  authenticateToken: jest.fn((req: any, res: any, next: any) => next())
}));
jest.mock('../../src/middleware/validation', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Users Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/users', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET / should call getData', async () => {
    (controller.getData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/users');
    expect(response.status).toBe(200);
    expect(controller.getData).toHaveBeenCalled();
  });

  it('POST / should call createData', async () => {
    (controller.createData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(201).json({ success: true }));
    const response = await request(app).post('/users').send({ username: 'test', password: 'pwd', fullname: 'Test User' });
    expect(response.status).toBe(201);
    expect(controller.createData).toHaveBeenCalled();
  });

  it('GET /:id should call getDataById', async () => {
    (controller.getDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/users/1');
    expect(response.status).toBe(200);
    expect(controller.getDataById).toHaveBeenCalled();
  });

  it('PUT /:id should call updateDataById', async () => {
    (controller.updateDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).put('/users/1').send({ fullname: 'Updated User' });
    expect(response.status).toBe(200);
    expect(controller.updateDataById).toHaveBeenCalled();
  });
});
