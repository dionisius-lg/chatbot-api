import request from 'supertest';
import express from 'express';

import router from '../../src/routes/faqs';
import * as controller from '../../src/controllers/faqs';

jest.mock('../../src/controllers/faqs');
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

describe('FAQs Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/faqs', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET / should call getData', async () => {
    (controller.getData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/faqs');
    expect(response.status).toBe(200);
    expect(controller.getData).toHaveBeenCalled();
  });

  it('POST / should call createData', async () => {
    (controller.createData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(201).json({ success: true }));
    const response = await request(app).post('/faqs').send({ category: 'test', intent: 'test', language_id: 1 });
    expect(response.status).toBe(201);
    expect(controller.createData).toHaveBeenCalled();
  });

  it('GET /:id should call getDataById', async () => {
    (controller.getDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/faqs/1');
    expect(response.status).toBe(200);
    expect(controller.getDataById).toHaveBeenCalled();
  });

  it('PUT /:id should call updateDataById', async () => {
    (controller.updateDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).put('/faqs/1').send({ category: 'updated' });
    expect(response.status).toBe(200);
    expect(controller.updateDataById).toHaveBeenCalled();
  });

  it('POST /import should call importData', async () => {
    (controller.importData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).post('/faqs/import');
    expect(response.status).toBe(200);
    expect(controller.importData).toHaveBeenCalled();
  });

  it('POST /train should call trainData', async () => {
    (controller.trainData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).post('/faqs/train');
    expect(response.status).toBe(200);
    expect(controller.trainData).toHaveBeenCalled();
  });
});
