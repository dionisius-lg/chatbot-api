import { Request, Response, NextFunction } from "express";
import moment from "moment-timezone";
import multer, { Options } from "multer";
import { isObjectLike } from "lodash";
import config from "./../config";
import storage from "./../config/storage";
import { sendBadRequest } from "./../helpers/response";
import { mimeFilter } from "./../helpers/file";

const { timezone } = config;

moment.tz.setDefault(timezone);

interface FileConfig {
    fieldname?: string;
    subpath?: string;
    sizelimit?: number;
    mimetypes?: string[];
    max?: number;
}

const single = ({ fieldname = 'file', subpath = '', sizelimit = 1, mimetypes }: FileConfig) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const ymd: string = moment(new Date()).format('YYYY/MM/DD');

        let options: Options = {
            storage: storage(`${subpath}/${ymd}`),
            // limits in bytes
            limits: { fileSize: 1000000 * sizelimit }
        };

        if (mimetypes && mimetypes.length > 0) {
            options.fileFilter = mimeFilter(mimetypes);
        }

        const upload = multer(options).single(fieldname);

        upload(req, res, async (err) => {
            if (err) {
                if (!req.file) {
                    let message: string = 'Please select file to upload asd';
    
                    if (isObjectLike(err) && err.message !== undefined) {
                        message = err.message;
                    }
    
                    return sendBadRequest(res, message);
                }

                return sendBadRequest(res, err?.message || 'File failed to upload');
            }

            next();
        });
    }
};

export default { single };