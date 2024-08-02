import { Request, Response, NextFunction } from "express";
import * as response from "./../helpers/response";

const validation = (schema: any, property: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[property as keyof typeof req]);

        if (error) {
            const { details } = error;
            const message = details.map((i: any) => i.message).join(',');

            return response.sendBadRequest(res, message);
        }

        if (property === 'body') {
            req.body = value;
        }

        return next();
    };
};

export default validation;