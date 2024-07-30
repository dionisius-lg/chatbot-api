import redis, { Redis, RedisOptions } from "ioredis";
import { isEmpty } from "./../helpers/value";
import config from ".";

const { cache: { host, port, password, db, duration, service } } = config;
const options: RedisOptions = { host, port, db, enableOfflineQueue: true };
const channel: string = `__keyevent@${db}__:expired`;

if (!isEmpty(password)) {
    options.password = password;
}

let subscriber: Redis | false = false;
let client: Redis | any = false;
let connected: boolean = false;

if (service.toString() === '1') {
    subscriber = new redis(options);
    client = new redis(options);

    subscriber.subscribe(channel);

    client.on('ready', () => {
        console.log(`[cache] is ready`);
        client?.config('SET', 'notify-keyspace-events', 'Ex');
    });

    client.on('connect', () => {
        console.log(`[cache] is connected`);
        connected = true;
    });

    client.on('error', (err: Error) => {
        console.error(`[cache] error: ${err?.message}`);
        connected = false;
    });

    client.on('reconnecting', () => {
        console.log(`[cache] reconnecting...`);
        connected = false;
    });
}

export default {
    connected,
    client,
    channel,
    duration
};