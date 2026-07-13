import path from 'path';
import crypto from 'crypto';
import * as cache from './../config/cache';
import * as loggerHelper from './../helpers/logger';
import * as valueHelper from './../helpers/value';

const fileSource = '/' + path.relative(process.cwd(), __filename);
const { createHash } = crypto;
const { isEmpty, isJson, isNumeric, safeJsonParse } = valueHelper;

/**
 * Retrieves data from the hash cache.
 * 
 * @template T
 * @param {string} [key=''] - Cache key.
 * @param {string} [field=''] - Cache field. If provided, gets field value; otherwise retrieves all fields.
 * @returns {Promise<T | string | null>} The parsed cache data, raw string, or null if not found/error.
 */
export async function getData<T = any>(key: string = '', field: string = ''): Promise<T | string | null> {
    try {
        if (!cache.connected) {
            throw new Error('Connection lost');
        }

        if (isEmpty(key)) {
            throw new Error('Invalid or missing required: key');
        }

        if (!isEmpty(field)) {
            const result = await cache.client.hGet(key, field);

            if (result === null || result === 'null') {
                return null;
            }

            return safeJsonParse<T>(result) as T | string | null;
        }

        const result = await cache.client.hGetAll(key);

        if (Object.keys(result).length === 0) {
            return null;
        }

        return safeJsonParse<T>(result) as T | string | null;
    } catch (err) {
        loggerHelper.error({
            source: fileSource,
            message: err instanceof Error ? err.message : String(err)
        });

        return null;
    }
}

/**
 * Retrieves the result of a database query from the query cache.
 * 
 * @template T
 * @param {string} [key=''] - Cache key.
 * @param {string} [field=''] - Query string (field).
 * @returns {Promise<T | string | null>} The parsed query result, raw string, or null if not found/error.
 */
export async function getDataQuery<T = any>(key: string = '', field: string = ''): Promise<T | string | null> {
    if (!cache.connected) {
        throw new Error('Connection lost');
    }

    const hashField: string = createHash('md5').update(field).digest('hex');

    try {
        const rawResult = await cache.client.hGet(key, hashField);
        let result: any = rawResult?.trim() ?? '';

        if (isJson(result)) {
            result = safeJsonParse(result);
        }

        return result as T | string | null;
    } catch (err) {
        return null;
    }
}

/**
 * Sets data into the hash cache.
 * 
 * @param {string} [key=''] - Cache key.
 * @param {string} [field=''] - Cache field.
 * @param {unknown} [value=''] - Value to cache.
 * @param {number} [expire=0] - Optional expiration in seconds.
 * @returns {Promise<number | null>} Result code from redis, or null on error.
 */
export async function setData(key: string = '', field: string = '', value: unknown = '', expire: number = 0): Promise<number | null> {
    try {
        if (!cache.connected) {
            throw new Error('Connection lost');
        }

        if (isEmpty(key) || isEmpty(field) || (isEmpty(value) && typeof value !== 'boolean')) {
            throw new Error('Invalid or missing required: key, field, or value');
        }

        let cleanedValue: string;

        if (typeof value === 'boolean') {
            cleanedValue = String(value);
        } else if (typeof value === 'object' && value !== null) {
            cleanedValue = JSON.stringify(value);
        } else {
            cleanedValue = String(value);
        }

        const result = await cache.client.hSet(key, field, cleanedValue);
        const expireTime = isNumeric(expire) && expire > 0 ? Number(expire) : cache.expire;

        if (expireTime > 0) {
            await cache.client.expire(key, expireTime);
        }

        return result;
    } catch (err) {
        loggerHelper.error({
            source: fileSource,
            message: err instanceof Error ? err.message : String(err)
        });

        return null;
    }
}

/**
 * Sets multiple fields/values into the hash cache at once.
 * 
 * @param {string} [key=''] - Cache key.
 * @param {Record<string, unknown>} [data={}] - Object map of fields and values to set.
 * @param {number} [expire=0] - Optional expiration in seconds.
 * @returns {Promise<number | null>} Result code from redis, or null on error.
 */
export async function setMultiData(key: string = '', data: Record<string, unknown> = {}, expire: number = 0): Promise<number | null> {
    try {
        if (!cache.connected) {
            throw new Error('Connection lost');
        }

        if (isEmpty(key)) {
            throw new Error('Invalid or missing required: key');
        }

        if (isEmpty(data)) {
            throw new Error('Invalid or missing required: data');
        }

        const cleanedData: Record<string, string> = {};

        for (const [field, value] of Object.entries(data)) {
            if (isEmpty(value) && typeof value !== 'boolean' && String(value) !== '0') {
                continue;
            }

            if (typeof value === 'object' && value !== null) {
                cleanedData[field] = JSON.stringify(value);
            } else {
                cleanedData[field] = String(value);
            }
        }

        const result = await cache.client.hSet(key, cleanedData);
        const expireTime = isNumeric(expire) && expire > 0 ? Number(expire) : cache.expire;

        if (expireTime > 0) {
            await cache.client.expire(key, expireTime);
        }

        return result;
    } catch (err) {
        loggerHelper.error({
            source: fileSource,
            message: err instanceof Error ? err.message : String(err)
        });

        return null;
    }
}

/**
 * Sets a database query result in the query cache.
 * 
 * @param {string} [key=''] - Cache key.
 * @param {string} [field=''] - Query string (field).
 * @param {any} value - Query result data.
 * @param {number} [expire=0] - Optional expiration in seconds.
 * @returns {Promise<number | null>} Result code from redis, or null on error.
 */
export async function setDataQuery(key: string = '', field: string = '', value: any = '', expire: number = 0): Promise<number | null> {
    try {
        if (!cache.connected) {
            throw new Error('Connection lost');
        }

        const hashField: string = createHash('md5').update(field).digest('hex');

        let cleanedValue: string;
        if (typeof value === 'object' && value !== null) {
            cleanedValue = JSON.stringify(value);
        } else {
            cleanedValue = String(value);
        }

        const result = await cache.client.hSet(`query:${key}`, hashField, cleanedValue);
        const expireTime = isNumeric(expire) && expire > 0 ? Number(expire) : cache.expire;

        if (expireTime > 0) {
            await cache.client.expire(`query:${key}`, expireTime);
        }

        return result;
    } catch (err) {
        loggerHelper.error({
            source: fileSource,
            message: err instanceof Error ? err.message : String(err)
        });

        return null;
    }
}

/**
 * Deletes key or key field from the hash cache.
 * 
 * @param {string} [key=''] - Cache key.
 * @param {string} [field=''] - Optional cache field. If provided, only deletes the field; otherwise deletes the whole key.
 * @returns {Promise<number | null>} Number of deleted keys/fields, or null on error.
 */
export async function deleteData(key = '', field = ''): Promise<number | null> {
    try {
        if (!cache.connected) {
            throw new Error('Connection lost');
        }

        if (isEmpty(key)) {
            throw new Error('Invalid or missing required: key');
        }

        if (!isEmpty(field)) {
            return await cache.client.hDel(key, field);
        }

        return await cache.client.del(key);
    } catch (err) {
        loggerHelper.error({
            source: fileSource,
            message: err instanceof Error ? err.message : String(err)
        });

        return null;
    }
}

/**
 * Deletes query results from the query cache.
 * Supports deleting one or multiple query keys.
 * 
 * @param {string | string[]} [key=''] - Cache key or array of cache keys.
 * @returns {Promise<number | null>} Number of deleted keys, or null on error.
 */
export async function deleteDataQuery(key: string | string[] = ''): Promise<number | null> {
    try {
        if (!cache.connected) {
            throw new Error('Connection lost');
        }

        if (isEmpty(key)) {
            throw new Error('Invalid or missing required: key');
        }

        const keys = Array.isArray(key) ? key : [key];
        const keysToDelete = keys.map((k) => `query:${k}`);

        return await cache.client.del(keysToDelete);
    } catch (err) {
        loggerHelper.error({
            source: fileSource,
            message: err instanceof Error ? err.message : String(err)
        });

        return null;
    }
}
