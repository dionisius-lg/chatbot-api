import { Request, Response } from "express";
import { unlinkSync } from "fs";
import * as faqAnswersModel from "./../models/faq_answers";
import * as faqsModel from "./../models/faqs";
import { sendSuccess, sendSuccessCreated, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { readExcel } from "./../helpers/thread";
import { filterColumn, filterData } from "./../helpers/request";
import { isEmpty } from "./../helpers/value";

export const getData = async (req: Request, res: Response) => {
    const { query } = req;
    const result = await faqAnswersModel.getAll(query);

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const getDataById = async (req: Request, res: Response) => {
    const { params: { id } } = req;
    const result = await faqAnswersModel.getDetail({ id });

    if (result.total_data > 0) {
        return sendSuccess(res, result);
    }

    return sendNotFoundData(res);
};

export const createData = async (req: Request, res: Response) => {
    let { body, decoded } = req;
    const faq = await faqsModel.getDetail({ is_active: 1, id: body?.faq_id });

    if (faq.total_data === 0 || !faq.data) {
        return sendNotFoundData(res, 'FAQ not found');
    }

    body.created_by = decoded?.user_id || null;

    const result = await faqAnswersModel.insertData(body);

    if (result.data) {
        return sendSuccessCreated(res, result);
    }

    return sendBadRequest(res);
};

export const updateDataById = async (req: Request, res: Response) => {
    let { body, params: { id }, decoded } = req;

    if (body?.faq_id) {
        const faq = await faqsModel.getDetail({ is_active: 1, id: body.faq_id });

        if (faq.total_data === 0 || !faq.data) {
            return sendNotFoundData(res, 'FAQ not found');
        }
    }

    body.update_by = decoded?.user_id || null;

    const result = await faqAnswersModel.updateData(body, { id });

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
        const allowedKeys = ['answer', 'category', 'intent', 'locale'];

        unlinkSync(file.path);

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const faqs = await faqsModel.getAll({ is_active: 1, limit: 0 });

        if (faqs.total_data === 0 || !faqs.data) {
            return sendNotFoundData(res, 'FAQ not found');
        }

        for (let i in excel.data) {
            let { category, intent, locale, ...row } = excel.data[i];

            filterColumn(row, allowedKeys);
            filterData(row);

            if (Object.keys(row).length === 0) {
                continue;
            }

            if (isEmpty(category) || isEmpty(intent) || isEmpty(locale)) {
                continue;
            }

            let faq = faqs.data.find((obj: Record<string, any>) =>
                obj.category.toLowerCase() === category.toLowerCase() && obj.intent.toLowerCase() === intent.toLowerCase() && obj.locale.toLowerCase() === locale.toLowerCase()
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
        const result = await faqAnswersModel.insertManyData(data);

        if (result.total_data > 0) {
            return sendSuccessCreated(res, result);
        }
    }

    return sendBadRequest(res);
};