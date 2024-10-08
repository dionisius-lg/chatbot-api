import express, { Router, Request, Response, NextFunction } from "express";
import { readdirSync } from "fs";
import path from "path";
import config from "./../config";
import { sendBadRequest, sendInternalServerError, sendNotFound } from "./../helpers/response";
import { authenticateToken, authenticateRefreshToken, authenticateKey } from "./../middleware/auth";
import { getContent } from "./../helpers/file";

const router: Router = express.Router();
const basename: string = path.basename(__filename);
const { env } = config;

const publicPath: string[] = ['/token', '/files'];
const refreshPath = ['/token/refresh']
const apiKeyPath: string[] = ['/webhook'];

const matchInArray = (string: string, expression: RegExp[]): boolean => {
    for (let exp of expression) {
        if (string.match(exp)) {
            return true;
        }
    }

    return false;
};

const unlessPath = (pathArr: string[] = [], middleware: (req: Request, res: Response, next: NextFunction) => void) => {
    return function(req: Request, res: Response, next: NextFunction) {
        const insideRegex = matchInArray(req.path, pathArr.map((p) => new RegExp(p)));

        if (pathArr.includes(req.path) || insideRegex) {
            return next();
        }

        return middleware(req, res, next);
    };
};

router.get('/', (req: Request, res: Response) => {
    const pkg = JSON.parse(getContent('package.json'));
    return res.send({
        app: pkg?.name || 'rest api',
        description: pkg?.description || ''
    });
});

// enable auth middleware except for some routes
router.use(apiKeyPath, authenticateKey);
router.use(refreshPath, authenticateRefreshToken);
router.use(unlessPath([...publicPath, ...refreshPath, ...apiKeyPath], authenticateToken));

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