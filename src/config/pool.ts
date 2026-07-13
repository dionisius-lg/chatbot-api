import path from 'path';
import pg, { Pool, PoolConfig, QueryResult } from 'pg';
// @ts-ignore
import utils from 'pg/lib/utils';
import config from '.';
import * as loggerHelper from './../helpers/logger';

const { database } = config;
const fileSource = '/' + path.relative(process.cwd(), __filename);

pg.types.setTypeParser(1082, (val) => val); // DATE
pg.types.setTypeParser(1114, (val) => val); // TIMESTAMP
pg.types.setTypeParser(1184, (val) => val); // TIMESTAMPTZ

const options: PoolConfig = {
    host: database.host,
    port: database.port,
    user: database.username,
    password: database.password,
    database: database.name,
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
};

const pool = new Pool(options);
const escape = (val: any) => utils.escapeLiteral(String(val));

pool.connect((err, client, release) => {
    if (err) {
        loggerHelper.error({
            source: fileSource,
            message: 'Connection error',
            error: err
        });
        return;
    }

    console.log(`[pool] connected to database ${database.name}`);
    release();
});

pool.on('error', (err) => {
    loggerHelper.error({
        source: fileSource,
        message: 'Unexpected error on idle',
        error: err
    });
});

export {
    escape,
    QueryResult
};

export default pool;
