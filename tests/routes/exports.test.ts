import request from 'supertest';
import express from 'express';

import router from '../../src/routes/exports';
import * as controller from '../../src/controllers/exports';

jest.mock('../../src/controllers/exports');
jest.mock('../../src/middleware/auth', () => ({
  __esModule: true,
  authenticateToken: jest.fn((req: any, res: any, next: any) => next())
}));

describe('Exports Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/exports', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /entities should call getEntities', async () => {
    (controller.getEntities as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/exports/entities');
    expect(response.status).toBe(200);
    expect(controller.getEntities).toHaveBeenCalled();
  });

  it('GET /faqs should call getFaqs', async () => {
    (controller.getFaqs as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/exports/faqs');
    expect(response.status).toBe(200);
    expect(controller.getFaqs).toHaveBeenCalled();
  });

  it('GET /faq_answers should call getFaqAnswers', async () => {
    (controller.getFaqAnswers as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/exports/faq_answers');
    expect(response.status).toBe(200);
    expect(controller.getFaqAnswers).toHaveBeenCalled();
  });

  it('GET /faq_questions should call getFaqQuestions', async () => {
    (controller.getFaqQuestions as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/exports/faq_questions');
    expect(response.status).toBe(200);
    expect(controller.getFaqQuestions).toHaveBeenCalled();
  });

  it('GET /languages should call getLanguages', async () => {
    (controller.getLanguages as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/exports/languages');
    expect(response.status).toBe(200);
    expect(controller.getLanguages).toHaveBeenCalled();
  });

  it('GET /users should call getUsers', async () => {
    (controller.getUsers as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ success: true }));
    const response = await request(app).get('/exports/users');
    expect(response.status).toBe(200);
    expect(controller.getUsers).toHaveBeenCalled();
  });
});
