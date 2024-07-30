import { Request } from "express";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import config from ".";
import { isEmpty, randomString } from "./../helpers/value";

const { file_dir } = config;

interface StorageOptions {
    subpath?: string | null;
}

type DestinationCallback = (err: Error | null, destination: string) => void;
type FilenameCallback = (err: Error | null, filename: string) => void;

const storage = (subpath?: string | null) => {
    return multer.diskStorage({
        destination: (req: Request, file: Express.Multer.File, callback: DestinationCallback): void => {
            let path = `${file_dir}/`;

            if (!isEmpty(subpath) && typeof subpath === 'string') {
                path += `${subpath}/`;
                path = path.replace(/\/+/g, '/');

                if (!existsSync(path)) {
                    mkdirSync(path, { mode: 0o777, recursive: true });
                }
            }

            callback(null, path);
        },
        filename: (req: Request, file: Express.Multer.File, callback: FilenameCallback): void => {
            const { originalname, fieldname } = file;
            const extension = originalname.split('.').pop();
            const filename = `${fieldname}-${randomString(16, true)}.${extension}`;

            callback(null, filename);
        },
    })
};

export default storage;