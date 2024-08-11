import { Request, Response } from "express";
import { unlinkSync } from "fs";
import * as faqsModel from "./../models/faqs";
import * as faqQuestionsModel from "./../models/faq_questions";
import { sendSuccess, sendSuccessCreated, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { readExcel } from "./../helpers/thread";
import { filterColumn, filterData } from "./../helpers/request";

export const getData = async (req: Request, res: Response) => {
    const { query } = req;
    const result = await faqQuestionsModel.getAll(query);

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const getDataById = async (req: Request, res: Response) => {
    const { params: { id } } = req;
    const result = await faqQuestionsModel.getDetail({ id });

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const createData = async (req: Request, res: Response) => {
    let { body, decoded } = req;

    body.created_by = decoded?.user_id || null;

    const result = await faqQuestionsModel.insertData(body);

    if (result.data) {
        return sendSuccessCreated(res, result);
    }

    return sendBadRequest(res);
};

export const updateDataById = async (req: Request, res: Response) => {
    let { body, params: { id }, decoded } = req;

    body.update_by = decoded?.user_id || null;

    const result = await faqQuestionsModel.updateData(body, { id });

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
        const allowedKeys = ['answer', 'intent', 'language_code'];

        unlinkSync(file.path);

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const faqs = await faqsModel.getAll({ is_active: 1, limit: 0 });

        if (faqs.total_data === 0 || !faqs.data) {
            return sendNotFoundData(res, 'FAQ not found');
        }

        for (let i in excel.data) {
            let { intent, language_code, ...row } = excel.data[i];

            filterColumn(row, allowedKeys);
            filterData(row);

            if (Object.keys(row).length === 0) {
                continue;
            }

            if (!intent) {
                continue;
            }

            let faq = faqs.data.find((obj: Record<string, any>) =>
                obj.intent.toLowerCase() === intent.toLowerCase() && obj.language_code.toLowerCase() === language_code.toLowerCase()
            );

            if (!faq) {
                continue;
            }

            data.push({
                ...row,
                faq_id: faq.id,
                created_by: decoded?.user_id || null
            });
        }
    }

    if (data.length > 0) {
        const result = await faqQuestionsModel.insertManyData(data);

        if (result.total_data > 0) {
            return sendSuccessCreated(res, result);
        }
    }

    return sendBadRequest(res);
};