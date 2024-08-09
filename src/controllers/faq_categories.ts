import { Request, Response } from "express";
import * as faqCategoriesModel from "./../models/faq_categories";
import { sendSuccess, sendSuccessCreated, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { readExcel } from "./../helpers/thread";
import { filterColumn, filterData } from "./../helpers/request";

export const getData = async (req: Request, res: Response) => {
    const { query } = req;
    const result = await faqCategoriesModel.getAll(query);

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const getDataById = async (req: Request, res: Response) => {
    const { params: { id } } = req;
    const result = await faqCategoriesModel.getDetail({ id });

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const createData = async (req: Request, res: Response) => {
    let { body, decoded } = req;

    body.created_by = decoded?.user_id || null;

    const result = await faqCategoriesModel.insertData(body);

    if (result.data) {
        return sendSuccessCreated(res, result);
    }

    return sendBadRequest(res);
};

export const updateDataById = async (req: Request, res: Response) => {
    let { body, params: { id }, decoded } = req;

    body.update_by = decoded?.user_id || null;

    const result = await faqCategoriesModel.updateData(body, { id });

    if (result.data) {
        return sendSuccess(res, result);
    }

    return sendBadRequest(res);
};

export const importData = async (req: Request, res: Response) => {
    const { file, decoded } = req;

    let data: Record<string, any>[] = [];

    if (file) {
        const excel = await readExcel(file);
        const allowedKeys = ['name'];

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        for (let i in excel.data) {
            let row = excel.data[i];

            filterColumn(row, allowedKeys);
            filterData(row);

            if (Object.keys(row).length === 0) {
                continue;
            }

            data.push({
                ...row,
                created_by: decoded?.user_id || null
            });
        }
    }

    if (data.length > 0) {
        const result = await faqCategoriesModel.insertManyData(data);

        if (result.total_data > 0) {
            return sendSuccessCreated(res, result);
        }
    }

    return sendBadRequest(res);
};