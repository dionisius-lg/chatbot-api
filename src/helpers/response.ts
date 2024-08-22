import { Response } from "express";
import moment from "moment-timezone";
import * as _ from "lodash";
import config from "./../config";
import { isNumeric } from "./value";

const { timezone } = config;

moment.tz.setDefault(timezone);

interface Result {
    [key: string]: any;
}

/**
 * 200 Success OK
 * @param {Response} res
 * @param {Result} result
 * @returns {Response} JSON object
 */
export const sendSuccess = (res: Response, result: Result | Result[] | null): Response => {
    if (result !== null && !Array.isArray(result) && _.isPlainObject(result)) {
        if (['total_data', 'data', 'limit', 'page'].every((prop) => prop in result)) {
            const { total_data, data, limit, page } = result as { total_data: any; data: any; limit: any; page: any; };

            if (isNumeric(total_data) && Array.isArray(data) && isNumeric(limit) && isNumeric(page)) {
                const currentPage = _.toNumber(page) > 0 ? _.toNumber(page) : 1;
                const previousPage = currentPage - 1;
                const nextPage = currentPage + 1;
                const firstPage = 1;
                const lastPage = _.ceil(_.toNumber(total_data) / _.toNumber(limit));

                result.paging = {
                    current: currentPage,
                    previous: previousPage > 0 ? previousPage : 1,
                    next: nextPage <= lastPage ? nextPage : lastPage,
                    first: firstPage,
                    last: lastPage > 0 ? lastPage : 1
                }
            }

            delete result['limit'];
            delete result['page'];
        }
    }

    return res.status(200).send(result);
};

/**
 * 201 Success Created
 * @param {Response} res
 * @param {Result} result
 * @returns {Response} JSON object
 */
export const sendSuccessCreated = (res: Response, result: Result | Result[] | null): Response => {
    return res.status(201).send(result);
};

/**
 * 400 Bad Request
 * @param {Response} res
 * @param {string} message
 * @returns {Response} JSON object
 */
export const sendBadRequest = (res: Response, message?: string): Response => {
    let error: string = message || 'Request is invalid';
    return res.status(400).send({ error });
};

/**
 * 401 Unauthorized
 * @param {Response} res
 * @param {string} message
 * @returns {Response} JSON object
 */
export const sendUnauthorized = (res: Response, message?: string): Response => {
    let error: string = message || 'You do not have rights to access this resource';
    return res.status(401).send({ error });
};

/**
 * 403 Forbidden
 * @param {Response} res
 * @returns {Response} JSON object
 */
export const sendForbidden = (res: Response): Response => {
    let error: string = 'You do not have rights to access this resource';
    return res.status(403).send({ error });
};

/**
 * 404 Resource Not Found
 * @param {Response} res
 * @returns {Response} JSON object
 */
export const sendNotFound = (res: Response): Response => {
    let error: string = 'Resource not found';
    return res.status(404).send({ error });
};

/**
 * 404 Data Not Found
 * @param {Response} res
 * @param {string} message
 * @returns {Response} JSON object
 */
export const sendNotFoundData = (res: Response, message?: string): Response => {
    let error: string = message || 'Data not found';
    return res.status(404).send({ error });
};

/**
 * 405 Method not allowed
 * @param {Response} res
 * @returns {Response} JSON object
 */
export const sendMethodNotAllowed = (res: Response): Response => {
    let error: string = 'This resource is not match with your request method';
    return res.status(405).send({ error });
};

/**
 * 429 Too many request
 * @param {Response} res
 * @param {string} message
 * @returns {Response} JSON object
 */
export const sendTooManyRequests = (res: Response, message?: string): Response => {
    let error: string = message || 'Too Many Requests';
    return res.status(429).send({ error });
};

/**
 * 500 Internal server error
 * @param {Response} res
 * @returns {Response} JSON object
 */
export const sendInternalServerError = (res: Response): Response => {
    let error: string = 'The server encountered an error, please try again later';
    return res.status(500).send({ error });
};