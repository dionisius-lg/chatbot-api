import { Request, Response } from "express";
import * as faqsModel from "./../models/faqs";
import * as faqsCategoriesModel from "./../models/faq_categories";
import * as languangesModel from "./../models/languages";
import { sendSuccess, sendSuccessCreated, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { readExcel } from "./../helpers/thread";

export const getData = async (req: Request, res: Response) => {
    const { query } = req;
    const result = await faqsModel.getAll(query);

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const getDataById = async (req: Request, res: Response) => {
    const { params: { id } } = req;
    const result = await faqsModel.getDetail({ id });

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const createData = async (req: Request, res: Response) => {
    let { body, decoded } = req;

    body.created_by = decoded?.user_id || null;

    const result = await faqsModel.insertData(body);

    if (result.data) {
        return sendSuccessCreated(res, result);
    }

    return sendBadRequest(res);
};

export const updateDataById = async (req: Request, res: Response) => {
    let { body, params: { id }, decoded } = req;

    body.update_by = decoded?.user_id || null;

    const result = await faqsModel.updateData(body, { id });

    if (result.data) {
        return sendSuccess(res, result);
    }

    return sendBadRequest(res);
};

export const importData = async (req: Request, res: Response) => {
    const { file } = req;

    if (file) {
        const excel = await readExcel(file);

        if (!excel.success) {
            return sendBadRequest(res, excel.error);
        }

        console.log(excel)
    }

    return sendBadRequest(res);
};