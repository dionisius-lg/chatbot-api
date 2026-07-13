import fs from 'fs';
import path from 'path';
import { Application, Request } from 'express';
import moment from 'moment-timezone';
import morgan from 'morgan';
import winston from 'winston';
import 'winston-daily-rotate-file';
import * as rfs from 'rotating-file-stream';
import config from './../config';
import * as valueHelper from './value';

moment.tz.setDefault(config.timezone);

interface winstonLogProps {
    source: string;
    message: string;
    data?: any;
    error?: any
}

const cacheMorganLogger: Record<string, rfs.RotatingFileStream> = {};
const cacheWinstonLogger: Record<string, winston.Logger> = {};

const createMorganStream = (type: string = 'access'): rfs.RotatingFileStream => {
    const logDir = path.resolve('./', 'logs', type);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logName = (time: number | Date): string => {
        return time ? ['access', moment(time).format('YYYY-MM-DD'), '.log'].join('-') : 'access.log';
    };

    const logStream = rfs.createStream(logName, {
        interval: '1d',
        path: logDir,
        compress: 'gzip',
        maxFiles: 90
    });

    logStream.on('rotated', (filename: string) => {
        console.log(`[logger] rotate ${type} log:`, filename);
    });

    logStream.on('error', (err: Error) => {
        console.log(`[logger] stream ${type} log error:`, err);
    });

    return logStream;
};

const createWinstonTransport = (type: string = 'success'): winston.Logger => {
    const logDir = path.resolve('./', 'logs', type);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logTransport = {
        level: 'info',
        filename: path.resolve(logDir, `${type}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '90d',
        maxSize: '20m',
        tailable: true,
        auditFile: path.resolve(logDir, `${type}-audit.json`),
        options: { flags: 'a' }
    };

    const logFormat = winston.format.printf((info) => {
        let logData: winstonLogProps = {
            source: info.source,
            message: info.message
        };

        if (info.data) {
            logData.data = info.data;
        }

        if (info.error) {
            if (info.error instanceof Error) {
                logData.error = {
                    message: info.error.message,
                    stack: info.error.stack
                };
            } else {
                logData.error = info.error;
            }
        }

        return `${info.timestamp} ${JSON.stringify(logData)}`;
    });

    const logger = winston.createLogger({
        level: 'info',
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    logFormat
                )
            }),

            new winston.transports.DailyRotateFile({
                ...logTransport,
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    logFormat
                )
            })
        ]
    });

    return logger;
};

const morganLogger = (type: string = 'access'): rfs.RotatingFileStream => {
    if (cacheMorganLogger[type]) {
        return cacheMorganLogger[type];
    }

    const logger = createMorganStream(type);
    cacheMorganLogger[type] = logger;

    return logger;
};

const winstonLogger = (type: string = 'success'): winston.Logger => {
    if (cacheWinstonLogger[type]) {
        return cacheWinstonLogger[type];
    }

    const logger = createWinstonTransport(type);
    cacheWinstonLogger[type] = logger;

    return logger;
};

export const access = (app: Application): void => {
    const stream = morganLogger('access');

    morgan.token('body', (req: Request) => {
        const { body } = req;

        if (body && typeof body === 'object') {
            const modifiedBody = valueHelper.maskSensitiveData(body);

            return JSON.stringify(modifiedBody);
        }

        return '';
    });

    morgan.token('date', (): string => {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    });

    morgan.token('secret', (req: Request) => {
        return req.headers && (req.headers['x-api-key'] as string);
    });

    app.use(
        morgan(
            ':remote-addr :remote-user [:date] :status [secret=:secret] ":method :url HTTP/:http-version" :body :response-time ms - :res[content-length] ',
            { stream }
        )
    );
};

export const debug = ({ source = 'server', message = '' }: winstonLogProps): void => {
    const logger = winstonLogger('success');
    logger.info({ source, message });
};

export const event = ({ source = 'server', message = '', data = null }: winstonLogProps): void => {
    const logger = winstonLogger('success');
    logger.info({ source, message, data });
};

export const error = ({ source = 'server', message = '', error = null }: winstonLogProps): void => {
    const logger = winstonLogger('error');
    logger.error({ source, message, error });
};

