import request from 'supertest';
import express from 'express';

import router from '../../src/routes/faq_answers';
import * as controller from '../../src/controllers/faq_answers';

jest.mock('../../src/controllers/faq_answers');
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

describe('FAQ Answers Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/faq_answers', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET / should call getData', async () => {
    (controller.getData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/faq_answers');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(controller.getData).toHaveBeenCalled();
  });

  it('POST / should call createData', async () => {
    (controller.createData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(201).json({ success: true }));
    const response = await request(app).post('/faq_answers').send({ answer: 'test', faq_id: 1 });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
    expect(controller.createData).toHaveBeenCalled();
  });

  it('GET /:id should call getDataById', async () => {
    (controller.getDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/faq_answers/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(controller.getDataById).toHaveBeenCalled();
  });

  it('PUT /:id should call updateDataById', async () => {
    (controller.updateDataById as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).put('/faq_answers/1').send({ answer: 'updated' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(controller.updateDataById).toHaveBeenCalled();
  });

  it('POST /import should call importData', async () => {
    (controller.importData as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).post('/faq_answers/import');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(controller.importData).toHaveBeenCalled();
  });
});
