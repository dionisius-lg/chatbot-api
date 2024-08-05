import { Request, Response } from "express";
import * as faqsModel from "./../models/faqs";
import * as faqsCategoriesModel from "./../models/faq_categories";
import * as languangesModel from "./../models/languages";
import { sendSuccess, sendSuccessCreated, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { readExcel } from "./../helpers/thread";
import { filterColumn, filterData } from "./../helpers/request";

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
    const { file, decoded } = req;

    let data: Record<string, any>[] = [];

    if (file) {
        const excel = await readExcel(file);

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const faqsCategories = await faqsCategoriesModel.getAll({ is_active: 1 });
        const languages = await languangesModel.getAll({ is_active: 1, limit: 0 });

        if (faqsCategories.total_data === 0 || !faqsCategories.data) {
            return sendNotFoundData(res, 'FAQ Categories not found');
        }

        if (languages.total_data === 0 || !languages.data) {
            return sendBadRequest(res, 'Languanges not found');
        }

        const allowedKeys = ['intent', 'faq_category', 'language'];

        for (let i in excel.data) {
            let { faq_category, language, ...row } = excel.data[i];

            filterColumn(row, allowedKeys);
            filterData(row);

            if (Object.keys(row).length === 0) {
                continue;
            }

            let faqCategory = faqsCategories.data.find((obj: Record<string, any>) => obj.name === faq_category);
            let faqLanguange = languages.data.find((obj: Record<string, any>) => obj.name === language);

            if (!faqCategory || !faqLanguange) {
                continue;
            }

            data.push({
                ...row,
                faq_category_id: faqCategory.id,
                language_id: faqLanguange.id,
                created_by: decoded?.user_id || null
            });
        }
    }

    if (data.length > 0) {
        const result = await faqsModel.insertManyData(data);

        if (result.total_data > 0) {
            return sendSuccessCreated(res, result);
        }
    }

    return sendBadRequest(res);
};