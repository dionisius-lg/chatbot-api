import { createCipheriv, createDecipheriv } from "crypto";
import config from "./../config";

const { secret } = config;
const algorithm = 'aes-256-cbc';
const key = Buffer.from(secret);
const iv = 'initVector16Bits';

export const encrypt = (value: string) => {
    try {
        if (typeof secret !== 'string' || secret.length !== 32) {
            throw new Error('Invalid secret');
        }

        const cipher = createCipheriv(algorithm, key, iv);
        return cipher.update(value, 'utf8', 'hex') + cipher.final('hex');
    } catch (err) {
        return null;
    }
};

export const decrypt = (value: string) => {
    try {
        if (typeof secret !== 'string' || secret.length !== 32) {
            throw new Error('Invalid secret');
        }

        const decipher = createDecipheriv(algorithm, key, iv);
        return decipher.update(value, 'hex', 'utf8') + decipher.final('utf8');
    } catch (err) {
        return null;
    }
};