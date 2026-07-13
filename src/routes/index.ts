import express, { Router, Request, Response, NextFunction } from "express";
import { readdirSync } from "fs";
import path from "path";
import config from "./../config";
import { sendBadRequest, sendInternalServerError, sendNotFound } from "./../helpers/response";
import { getContent } from "./../helpers/file";

const router: Router = express.Router();
const basename: string = path.basename(__filename);
const { env } = config;

router.get('/', (req: Request, res: Response) => {
    let pkg = JSON.parse(getContent('package.json'));

    if (pkg?.name && typeof pkg.name === 'string') {
        // split the string into an array by hyphens, capitalize the first letter of each word, join the words with a space
        pkg.name = pkg.name.split('-').map((w: string) => w === 'api' ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return res.send({ app: pkg?.name || 'API', description: pkg?.description || '' });
});

readdirSync(__dirname).filter((file: string) => {
    if (env === 'production') {
        return file.includes('.') && file !== basename && ['.js'].includes(path.extname(file));
    }

    return file.includes('.') && file !== basename && ['.ts'].includes(path.extname(file));
}).forEach((file: string) => {
    let filename = path.parse(file).name;
    router.use(`/${filename}`, require(`./${filename}`).default);
});

router.use('*', (req: Request, res: Response) => {
    sendNotFound(res);
});

if (env === 'production') {
    // override error
    router.use((error: any, req: Request, res: Response, next: NextFunction) => {
        if (error instanceof SyntaxError) {
            return sendBadRequest(res);
        }

        console.error(error.stack);
        sendInternalServerError(res);
    });
}

export default router;
