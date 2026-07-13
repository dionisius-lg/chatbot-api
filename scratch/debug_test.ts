import express from 'express';
// Mock pool
import pg from 'pg';
jest.mock('../../src/config/pool', () => ({
  default: {
    connect: (cb: any) => cb(null, {}, () => {}),
    on: () => {}
  },
  escape: (val: any) => val
}));

import router from '../src/routes/faq_answers';

console.log('Router imported successfully!');

const app = express();
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use('/faq_answers', router);

// Handle errors
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Express error handler caught error:', err);
  res.status(500).send(err.message);
});

console.log('App configured. Dispatching request...');

import request from 'supertest';
request(app)
  .get('/faq_answers')
  .end((err, res) => {
    if (err) {
      console.error('Supertest error:', err);
    } else {
      console.log('Supertest response:', res.status, res.body);
    }
    process.exit(0);
  });
