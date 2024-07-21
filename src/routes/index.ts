import express, { Router, Request, Response, NextFunction } from "express";
import { readdirSync } from "fs";
import path from "path";
import config from "./../config";
import * as responseHelper from "./../helpers/response";
import { authenticateKey, authenticateToken } from "./../middleware/auth";

const router: Router = express.Router();
const basename: string = path.basename(__filename);
const { env } = config;

const publicPath: string[] = ['token'];
const apiKeyPath: string[] = ['webhook'];

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
    return res.send({ app: 'Whatsapp Gateway API' });
});

// enable auth middleware except for some routes
router.use(apiKeyPath, authenticateKey);
router.use(unlessPath([...publicPath, ...apiKeyPath], authenticateToken));
// router.use(unlessPath([...publicPath], authenticateKey));

readdirSync(__dirname).filter((file: string) => {
    return file.includes('.') && file !== basename && ['.js', '.ts'].includes(path.extname(file));
}).forEach((file: string) => {
    let filename = path.parse(file).name;
    router.use(`/${filename}`, require(`./${filename}`).default);
});

router.use('*', (req: Request, res: Response) => {
    responseHelper.sendNotFound(res);
});

if (env === 'production') {
    // override error
    router.use((error: any, req: Request, res: Response, next: NextFunction) => {
        if (error instanceof SyntaxError) {
            return responseHelper.sendBadRequest(res);
        }

        console.error(error.stack);
        responseHelper.sendInternalServerError(res);
    });
}

export default router;