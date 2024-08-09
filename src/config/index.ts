import dotenv from "dotenv";
import { getContent, putContent } from "./../helpers/file";
import { randomString, isEmpty } from "../helpers/value";

dotenv.config({ path: './.env' });

interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
}

interface JwtConfig {
    key: string;
    expire: string;
    refresh_key: string;
    refresh_expire: string;
    algorithm: string;
    live: number;
}

interface CacheConfig {
    host: string;
    port: number;
    db: number;
    password: string;
    duration: number;
    service: number;
}

interface Config {
    env: string;
    timezone: string;
    port: number;
    database: DatabaseConfig;
    jwt: JwtConfig;
    cache: CacheConfig;
    file_dir: string;
    secret: string;
    app_key: string;
}

const appKey = (): string => {
    // check api key
    let key = getContent('key.txt');

    // generate new api key if not exist
    if (isEmpty(key)) {
        key = randomString(48, true, true);
        putContent('key.txt', key);
        console.log(`[server] is generate new Api Key ${key}`);
    }

    return key;
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    timezone: 'Asia/Jakarta',
    port: parseInt(process.env.PORT || '3000'),
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'test',
    },
    jwt: {
		key: process.env.JWT_KEY || 'the_key',
        expire: process.env.JWT_EXPIRE || '1h', // token will expire after this value (in seconds or a string describing a time span zeit/ms)
		refresh_key: process.env.JWT_REFRESH_KEY || 'the_key',
        refresh_expire: process.env.JWT_EXPIRE_REFRESH || '1h', // refresh token will expire after this value (in seconds or a string describing a time span zeit/ms)
		algorithm: process.env.JWT_ALGORITHM || 'HS256',
		live: parseInt(process.env.JWT_LIVE || '0'), // token will apply after this value (in seconds)
		
	},
    cache: {
        host: process.env.CACHE_HOST || 'localhost',
        port: parseInt(process.env.CACHE_PORT || '6379'),
        db: parseInt(process.env.CACHE_DB || '0'),
        password: process.env.CACHE_PASSWORD || '',
        duration: parseInt(process.env.CACHE_DATA_DURATION || '3600'), // in seconds
        service: parseInt(process.env.CACHE_SERVICE || '0'),
    },
    file_dir: process.env.FILE_DIR || './',
    secret: process.env.SECRET || 'secret',
    app_key: appKey(),
}

export default config;