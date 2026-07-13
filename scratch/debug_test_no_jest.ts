// Override pg and ioredis in require.cache before any imports
const Module = require('module');
const pgPath = require.resolve('pg');
const ioredisPath = require.resolve('ioredis');

require.cache[pgPath] = {
  id: pgPath,
  filename: pgPath,
  loaded: true,
  exports: {
    Pool: class {
      connect(cb: any) {
        if (cb) cb(null, {}, () => {});
        return Promise.resolve({});
      }
      query(q: any, cb: any) {
        if (cb) cb(null, { rows: [] });
      }
      on() {}
    },
    types: {
      setTypeParser() {}
    }
  }
} as any;

require.cache[ioredisPath] = {
  id: ioredisPath,
  filename: ioredisPath,
  loaded: true,
  exports: {
    default: class {
      on(event: string, cb: any) {
        if (event === 'connect' || event === 'ready') {
          setTimeout(cb, 0);
        }
        return this;
      }
      subscribe() {}
    }
  }
} as any;

import express from 'express';
import router from '../src/routes/faq_answers';
import request from 'supertest';

console.log('Modules overridden. Router imported successfully.');

const app = express();
app.use(express.json());

// Log all incoming requests to Express
app.use((req, res, next) => {
  console.log(`Express incoming: ${req.method} ${req.url}`);
  next();
});

app.use('/faq_answers', router);

console.log('App configured. Starting request...');

request(app)
  .get('/faq_answers')
  .end((err, res) => {
    if (err) {
      console.error('Supertest error:', err);
    } else {
      console.log('Supertest response received:', res.status, res.body);
    }
    process.exit(0);
  });
