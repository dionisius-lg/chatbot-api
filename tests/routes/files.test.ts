import request from 'supertest';
import express from 'express';

import router from '../../src/routes/files';
import * as controller from '../../src/controllers/files';

jest.mock('../../src/controllers/files');
jest.mock('../../src/middleware/validation', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Files Router', () => {
  const app = express();
  app.use(express.json());
  app.use('/files', router);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /:id should call download', async () => {
    (controller.download as jest.Mock).mockImplementationOnce((req: any, res: any) => res.status(200).send('file-content'));
    const response = await request(app).get('/files/123');
    expect(response.status).toBe(200);
    expect(response.text).toBe('file-content');
    expect(controller.download).toHaveBeenCalled();
  });
});
