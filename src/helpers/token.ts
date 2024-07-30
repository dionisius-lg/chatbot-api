import moment from "moment-timezone";
import ms from "ms";
import jwt, { Secret, SignOptions, Algorithm } from "jsonwebtoken";
import config from "./../config";

const { timezone, jwt: { key, expire, refresh_key, refresh_expire, algorithm } } = config;

moment.tz.setDefault(timezone);

interface Payload {
    user_id: number;
    user_agent: string;
    ip_address: string;
}

interface Result {
    token: string | undefined;
    expire?: string | undefined;
}

export const create = (payload: Payload): Promise<Result> => {
    return new Promise((resolve) => {
        const miliSeconds: number = ms(expire);
        const expireDate = moment(new Date()).add(miliSeconds, 'ms').format('YYYY-MM-DD HH:mm:ss');
        const secret: Secret = key;
        const options: SignOptions = {
            algorithm: algorithm as Algorithm,
            expiresIn: expire
        };

        jwt.sign(payload, secret, options, (err: Error | null, encoded: string | undefined) => {
            if (err) {
                console.error(err);
                resolve({ token: undefined });
            }

            resolve({
                token: encoded,
                expire: expireDate
            });
        })
    });
};

export const createRefresh = (payload: Payload): Promise<Result> => {
    return new Promise((resolve) => {
        const miliSeconds: number = ms(refresh_expire);
        const expireDate = moment(new Date()).add(miliSeconds, 'ms').format('YYYY-MM-DD HH:mm:ss');
        const secret: Secret = refresh_key;
        const options: SignOptions = {
            algorithm: algorithm as Algorithm,
            expiresIn: refresh_expire
        };

        jwt.sign(payload, secret, options, (err: Error | null, encoded: string | undefined) => {
            if (err) {
                console.error(err);
                resolve({ token: undefined });
            }

            resolve({
                token: encoded,
                expire: expireDate
            });
        })
    });
};