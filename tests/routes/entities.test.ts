import request from 'supertest';
import express from 'express';

import router from '../../src/routes/entities';
import * as controller from '../../src/controllers/entities';

jest.mock('../../src/controllers/entities');
jest.mock('../../src/middleware/auth', () => ({
  __esModule: true,
  authenticateToken: jest.fn((req: any, res: any, next: any) => next())
}));
jest.mock('../../src/middleware/validation', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => next())
}));
jest.mock('../../src/middleware/file_validation', () => ({
  __esModule: true,
  default: {
    single: jest.fn(() => (req: any, res: any, next: any) => next())
  }
}));

describe('Entities Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/entities', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET / should call getData', async () => {
    (controller.getData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/entities');
    expect(response.status).toBe(200);
    expect(controller.getData).toHaveBeenCalled();
  });

  it('POST / should call createData', async () => {
    (controller.createData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(201).json({ success: true }));
    const response = await request(app).post('/entities').send({ name: 'test', type: 'string', value: 'test' });
    expect(response.status).toBe(201);
    expect(controller.createData).toHaveBeenCalled();
  });

  it('GET /:id should call getDataById', async () => {
    (controller.getDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/entities/1');
    expect(response.status).toBe(200);
    expect(controller.getDataById).toHaveBeenCalled();
  });

  it('PUT /:id should call updateDataById', async () => {
    (controller.updateDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).put('/entities/1').send({ name: 'updated' });
    expect(response.status).toBe(200);
    expect(controller.updateDataById).toHaveBeenCalled();
  });

  it('POST /import should call importData', async () => {
    (controller.importData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).post('/entities/import');
    expect(response.status).toBe(200);
    expect(controller.importData).toHaveBeenCalled();
  });
});
