import { Request, Response } from "express";
import bcrypt from "bcrypt";
import * as usersModel from "./../models/users";
import * as refreshTokensModel from "./../models/refresh-tokens";
import * as responseHelper from "./../helpers/response";
import * as tokenHelper from "../helpers/token";

export const auth = async (req: Request, res: Response) => {
    const { body: { username, password }, headers, socket: { remoteAddress } } = req;
    const { data } = await usersModel.getDetail({ username, is_active: 1 });

    if (data === false) {
        return responseHelper.sendNotFoundData(res, 'User not found. Please input a registered username');
    }

    if (!bcrypt.compareSync(password, data.password)) {
        return responseHelper.sendUnauthorized(res, 'Invalid password');
    }

    const tokenPayload = {
        user_id: data.id,
        user_agent: headers?.['user-agent'] || 'unknown',
        ip_address: remoteAddress || 'unknown'
    }

    const createToken = await tokenHelper.create(tokenPayload);
    const createRefreshToken = await tokenHelper.createRefresh(tokenPayload);

    if (!createToken.token || !createRefreshToken.token) {
        return responseHelper.sendBadRequest(res);
    }

    await refreshTokensModel.insertUpdateData([{
        ...tokenPayload,
        token: createRefreshToken.token,
        expired: createRefreshToken.expire
    }]);

    const result = {
        total_data: 1,
        data: {
            user_id: data.id,
            token: createToken.token,
            expire: createToken.expire,
            refresh_token: createRefreshToken.token,
            refresh_expire: createRefreshToken.expire
        }
    }

    return responseHelper.sendSuccess(res, result);
};

export const refreshAuth = async (req: Request, res: Response) => {
    const { decoded, headers, socket: { remoteAddress } } = req;

    if (decoded?.user_id) {
        const { data } = await usersModel.getDetail({ id: decoded.user_id });

        if (data === false) {
            return responseHelper.sendNotFoundData(res, 'User not found');
        }

        const tokenPayload = {
            user_id: decoded.user_id,
            user_agent: headers?.['user-agent'] || 'unknown',
            ip_address: remoteAddress || 'unknown'
        }

        const createToken = await tokenHelper.create(tokenPayload);
        const createRefreshToken = await tokenHelper.createRefresh(tokenPayload);

        if (!createToken.token || !createRefreshToken.token) {
            return responseHelper.sendBadRequest(res);
        }

        await refreshTokensModel.insertUpdateData([{
            ...tokenPayload,
            token: createRefreshToken.token,
            expired: createRefreshToken.expire
        }]);

        const result = {
            total_data: 1,
            data: {
                user_id: data.id,
                token: createToken.token,
                expire: createToken.expire,
                refresh_token: createRefreshToken.token,
                refresh_expire: createRefreshToken.expire
            }
        }
    
        return responseHelper.sendSuccess(res, result);
    }

    return responseHelper.sendUnauthorized(res);
};