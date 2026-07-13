import request from 'supertest';
import express from 'express';

import router from '../../src/routes/webhook';
import * as controller from '../../src/controllers/webhook';

jest.mock('../../src/controllers/webhook');
jest.mock('../../src/middleware/auth', () => ({
  __esModule: true,
  authenticateKey: jest.fn((req: any, res: any, next: any) => next())
}));
jest.mock('../../src/middleware/validation', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Webhook Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/webhook', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /chat should call chat', async () => {
    (controller.chat as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).json({ reply: 'hello' }));
    const response = await request(app).post('/webhook/chat').send({ message: 'hi' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ reply: 'hello' });
    expect(controller.chat).toHaveBeenCalled();
  });
});
