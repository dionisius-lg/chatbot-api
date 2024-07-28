import { Request, Response } from "express";
import bcrypt from "bcrypt";
import * as usersModel from "./../models/users";
import * as responseHelper from "./../helpers/response";
import { isEmpty } from "./../helpers/value";

export const getData = async (req: Request, res: Response) => {
    const { query } = req;
    const result = await usersModel.getAll(query);

    if (result.total_data > 0) {
        return responseHelper.sendSuccess(res, result);
    }

    return responseHelper.sendNotFoundData(res);
};

export const getDataById = async (req: Request, res: Response) => {
    const { params: { id } } = req;
    const result = await usersModel.getDetail({ id });

    if (result.total_data > 0) {
        return responseHelper.sendSuccess(res, result);
    }

    return responseHelper.sendNotFoundData(res);
};

export const createData = async (req: Request, res: Response) => {
    let { body, decoded } = req;

    body.password = bcrypt.hashSync(body.password, 10);
    body.created_by = decoded?.user_id || null;

    const result = await usersModel.insertData(body);

    if (result.data) {
        return responseHelper.sendSuccessCreated(res, result);
    }

    return responseHelper.sendBadRequest(res);
};

export const updateDataById = async (req: Request, res: Response) => {
    let { body, params: { id }, decoded } = req;

    if (body?.password && !isEmpty(body.password)) {
        body.password = bcrypt.hashSync(body.password, 10);
    }

    body.update_by = decoded?.user_id || null;

    const result = await usersModel.updateData(body, { id });

    if (result.data) {
        return responseHelper.sendSuccess(res, result);
    }

    return responseHelper.sendBadRequest(res);
};