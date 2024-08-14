import { Request } from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { isEmpty } from "./value";

export const mimeFilter = (mimetypes: string[]) => {
    return (req: Request, file: Express.Multer.File, callback: Function) => {
        if (mimetypes.includes(`${file.mimetype}`)) {
            return callback(null, true);
        }

        callback(new Error('Invalid file type. Only the following type(s) are allowed: ' + mimetypes.join(', ')), false);
    }
};

export const getContent = (filename: string, subpath?: string): string => {
    try {
        if (isEmpty(filename)) {
            throw new Error('Filename cannot be empty');
        }

        // sanitize filename
        filename = filename.replace(/[^a-zA-Z0-9 _.\-]/g, '').trim();

        let filedir = './';

        if (subpath && !isEmpty(subpath)) {
            // replace multiple slash to single slash
            subpath = subpath.replace(/\/+/g, '/');
            // remove first & last slash
            subpath = subpath.replace(/^\/|\/$/g, '');
            // concat filedir with concat
            filedir += `${subpath}/`;
        }

        const fullpath = `${filedir}${filename}`;

        if (!existsSync(fullpath)) {
            throw new Error(`File not found: ${fullpath}`);
        }

        const result = readFileSync(fullpath, 'utf-8');

        return result;
    } catch (err) {
        return '';
    }
};

export const putContent = (filename: string, data: string, subpath?: string): boolean => {
    try {
        if (isEmpty(filename) || isEmpty(data)) {
            throw new Error('Filename or data cannot be empty');
        }

        // sanitize filename
        filename = filename.replace(/[^a-zA-Z0-9 _.\-]/g, '').trim();

        let filedir = './';

        if (subpath && !isEmpty(subpath)) {
            // replace multiple slash to single slash
            subpath = subpath.replace(/\/+/g, '/');
            // remove first & last slash
            subpath = subpath.replace(/^\/|\/$/g, '');
            // concat filedir with concat
            filedir += `${subpath}/`;

            if (!existsSync(filedir)) {
                mkdirSync(filedir, { mode: 0o777, recursive: true });
            }
        }

        const fullpath = `${filedir}${filename}`;

        writeFileSync(fullpath, data, 'utf8');

        return true;
    } catch (err) {
        return false;
    }
};