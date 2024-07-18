import { Request, Response, NextFunction } from "express";
import jwt, { Secret, Algorithm, VerifyOptions, VerifyErrors, Jwt, JwtPayload } from 'jsonwebtoken';
import config from "../config";
import { readContent } from "./../helpers/file";
import * as responseHelper from "./../helpers/response";


/**
 * Verify client's JWT Token
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next method
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const { headers } = req;
    const authKey = headers?.authorization || null;

    if (authKey && typeof authKey === 'string') {
        // extract token from the authorization header
        const matches = authKey.match(/^Bearer\s+(.*)$/);

        if (matches) {
            const token: string = matches[1];
            const secret: Secret = config.jwt.key;
            const algorithms: Algorithm[] = [config.jwt.algorithm as Algorithm];
            const options: VerifyOptions = { algorithms };

            jwt.verify(token, secret, options, (err: VerifyErrors | null, decoded: string | Jwt | JwtPayload | undefined) => {
                if (err) {
                    return responseHelper.sendUnauthorized(res);
                }

                // Attach decoded information to request object
                (req as any).decoded = decoded;
                return next();
            });

            return responseHelper.sendUnauthorized(res);
        }
    }

    return responseHelper.sendForbidden(res);
};

/**
 * Verify client's api key
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next method
 */
export const authenticateKey = (req: Request, res: Response, next: NextFunction) => {
    const { headers } = req;
    const authKey = headers?.['x-api-key'] || null;

    if (authKey) {
        const key = readContent('key.txt');

        if (key !== authKey) {
            return responseHelper.sendUnauthorized(res, 'API key not valid');
        }

        return next();
    }

    return responseHelper.sendForbidden(res);
};