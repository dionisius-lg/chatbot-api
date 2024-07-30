import { isJson } from "./value";
import { createHash } from "crypto";
import * as _ from "lodash";
import cache from "./../config/cache";

interface Data {
    key: string;
}

interface SetExpire extends Data {
    expire: number;
}

interface GetData extends Data {
    field: string;
}

interface SetData extends Data {
    field: string;
    value: string | object | any[];
    expire?: number;
}

interface DeleteData extends Data {
    field?: string;
}

interface DeleteDataQuery {
    key: any[];
}

/**
 * Check cache key and field
 * @param key - cache key
 * @param field - cache field
 */
export const checkData = async ({ key, field }: GetData) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        const result = await client.hexists(key, field);
        return result;
    } catch (err) {
        return false;
    }
    
};

/**
 * Set expire data to cache
 * @param key - cache key
 * @param expire - expire value (in seconds)
 */
export const setExpire = async ({ key, expire }: SetExpire) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        const result = await client.expire(key, expire);
        return result;
    } catch (err) {
        return false;
    }
};

/**
 * Get data from cache
 * @param key - cache key
 * @param field - cache field
 */
export const getData = async ({ key, field }: GetData) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        const result = await client.hmget(key, field);
        return result.trim();
    } catch (err) {
        return false;
    }
};

/**
 * Get data query result from cache
 * @param key - cache key
 * @param field - cache field
 */
export const getDataQuery = async ({ key, field }: GetData) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;
    const hashField: string = createHash('md5').update(field).digest('hex');

    try {
        let result = await client.hmget(key, hashField);
            result = result.trim();

        if (isJson(result)) {
            result = JSON.parse(result);
        }

        return result;
    } catch (err) {
        return false;
    }
};

/**
 * set data to cache
 * @param key - cache key
 * @param field - cache field
 * @param value - cache data
 * @param expire - expire value (in seconds)
 */
export const setData = async ({ key, field, value, expire }: SetData) => {
    if (!cache.connected) {
        return false;
    }

    const { client, duration } = cache;

    if (_.isObjectLike(value)) {
        value = JSON.stringify(value);
    }

    try {
        const result = await client.hset(key, field, value);

        switch (true) {
            case (expire && expire > 0):
                await setExpire({ key, expire });
                break;
            default:
                await setExpire({ key, expire: duration });
                break;
        }

        return result;
    } catch (err) {
        return false;
    }
};

/**
 * Set data query result to cache
 * @param key - cache key
 * @param field - cache field
 * @param data - cache data
 * @param expire - expire value (in seconds)
 */
export const setDataQuery = async ({ key, field, value, expire }: SetData) => {
    if (!cache.connected) {
        return false;
    }

    const { client, duration } = cache;
    const hashField: string = createHash('md5').update(field).digest('hex');

    if (_.isObjectLike(value)) {
        value = JSON.stringify(value);
    }

    try {
        const result = await client.hset(`query:${key}`, hashField, value);

        switch (true) {
            case (expire && expire > 0):
                await setExpire({ key: `query:${key}`, expire });
                break;
            default:
                await setExpire({ key: `query:${key}`, expire: duration });
                break;
        }

        return result;
    } catch (err) {
        return false;
    }
};

/**
 * Delete data from cache
 * @param key - cache key
 * @param field - cache field
 */
export const deleteData = async ({ key, field }: DeleteData) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        if (field) {
            await client.hdel(key, field);
            return key;
        }

        await client.del(key);
        return key;
    } catch (err) {
        return false;
    }
};

/**
 * Delete data from cache
 * @param key - cache key
 */
export const deleteDataQuery = async ({ key }: DeleteDataQuery) => {
    if (!cache.connected) {
        return false;
    }

    const { client } = cache;

    try {
        for (let i in key) {
            await client.del(`query:${key}`);
        }

        return key.length;
    } catch (err) {
        return false;
    }
};