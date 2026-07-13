import { createCipheriv, createDecipheriv, CipherKey, BinaryLike } from 'crypto';
import config from './../config';

const { secret } = config;
const algorithm = 'aes-256-cbc';

export const encrypt = (value: string) => {
    try {
        if (typeof secret !== 'string' || secret.length !== 32) {
            throw new Error('Invalid secret');
        }

        const key = Buffer.from(secret) as CipherKey;
        const iv = Buffer.from('initVector16Bits') as BinaryLike;

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

        const key = Buffer.from(secret) as CipherKey;
        const iv = Buffer.from('initVector16Bits') as BinaryLike;

        const decipher = createDecipheriv(algorithm, key, iv);
        return decipher.update(value, 'hex', 'utf8') + decipher.final('utf8');
    } catch (err) {
        return null;
    }
};
