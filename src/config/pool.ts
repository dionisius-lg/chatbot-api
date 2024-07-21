import mysql, { PoolOptions, PoolConnection, QueryError, RowDataPacket, ResultSetHeader } from "mysql2";
import config from ".";

const { database } = config;

const options: PoolOptions = {
    host: database.host,
    port: database.port,
    user: database.username,
    password: database.password,
    database: database.name,
    connectionLimit: 50,
    charset: 'UTF8MB4_GENERAL_CI',
    // Allow multiple mysql statements per query
    multipleStatements: true,
    // Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then inflated into JavaScript Date objects
    dateStrings: true
};

const pool = mysql.createPool(options);
const escape = mysql.escape;

pool.getConnection((err: NodeJS.ErrnoException | null, conn: PoolConnection) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(`[pool] is connected. Thread ID: ${conn.threadId}`);
});

export {
    escape,
    QueryError,
    RowDataPacket,
    ResultSetHeader
};

export default pool;