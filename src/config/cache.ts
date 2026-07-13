import path from 'path';
import { createClient, RedisClientOptions } from 'redis';
import config from './index';
import * as loggerHelper from './../helpers/logger';
import * as valueHelper from './../helpers/value';

export let connected: boolean = false;

const fileSource = '/' + path.relative(process.cwd(), __filename);

const options: RedisClientOptions = {
    socket: {
        host: config.cache.host,
        port: config.cache.port,
        connectTimeout: 5000,
        keepAlive: true,
        reconnectStrategy: (attempt: number): number => {
            if (attempt > 1000) {
                loggerHelper.error({
                    source: fileSource,
                    message: 'Cache reconnecting too long'
                });
            }

            return Math.min(attempt * 50, 500);
        }
    },
    database: config.cache.db,
    disableOfflineQueue: false
};

if (!valueHelper.isEmpty(config.cache.password)) {
    options.password = config.cache.password;
}

export const client = createClient(options);
export const subscriber = createClient(options);

client.on('connect', () => {
    connected = true;
    console.log(`[cache] connected`);
});

client.on('ready', () => {
    connected = true;
    console.log(`[cache] ready to use`);
});

client.on('reconnecting', () => {
    connected = false;
    console.log(`[cache] reconnecting...`);
});

client.on('error', (err: Error) => {
    connected = false;
    loggerHelper.error({
        source: fileSource,
        message: `Cache error! ${err?.message}`,
        error: err
    });
});

// --- Init Connection & Pub/Sub ---
const initConnection = async (): Promise<void> => {
    try {
        await client.connect();
        await subscriber.connect();

        const channel: string = `__keyevent@${config.cache.db}__:expired`;

        await subscriber.subscribe(channel, (message: string, channelName: string) => {
            loggerHelper.event({
                source: fileSource,
                message: `Received subscribe event`,
                data: { channel: channelName, message }
            });
        });
    } catch (err: any) {
        loggerHelper.error({
            source: fileSource,
            message: `Could not establish connection`,
            error: err
        });
    }
};

if (config.cache.service === 1) {
    initConnection();
}

export const expire: number = config.cache.duration;
