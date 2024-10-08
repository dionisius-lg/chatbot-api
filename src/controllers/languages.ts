import { Request, Response } from "express";
import * as languagesModel from "./../models/languages";
import { sendSuccess, sendNotFoundData } from "./../helpers/response";

export const getData = async (req: Request, res: Response) => {
    const { query } = req;
    const result = await languagesModel.getAll(query);

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const getDataById = async (req: Request, res: Response) => {
    const { params: { id } } = req;
    const result = await languagesModel.getDetail({ id });

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};