import { Request, Response } from 'express';
import { unlinkSync } from 'fs';
import * as faqsModel from './../models/faqs';
import * as languagesModel from './../models/languages';
import { sendSuccess, sendSuccessCreated, sendBadRequest, sendNotFoundData } from './../helpers/response';
import { readExcel, trainNetwork } from './../helpers/thread';
import { filterColumn, filterData } from './../helpers/request';
import { isEmpty } from './../helpers/value';

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
    const language = await languagesModel.getDetail({ is_active: true, id: body?.language_id });

    if (language.total_data === 0 || !language.data) {
        return sendNotFoundData(res, 'Language not found');
    }

    body.created_by = decoded?.user_id || null;

    const result = await faqsModel.insertData(body);

    if (result.data) {
        return sendSuccessCreated(res, result);
    }

    return sendBadRequest(res);
};

export const updateDataById = async (req: Request, res: Response) => {
    let { body, params: { id }, decoded } = req;

    if (body?.language_id) {
        const language = await languagesModel.getDetail({ is_active: true, id: body.language_id });

        if (language.total_data === 0 || !language.data) {
            return sendNotFoundData(res, 'Language not found');
        }
    }

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
        const allowedKeys = ['category', 'intent', 'locale'];

        unlinkSync(file.path);

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const languages = await languagesModel.getAll({ is_active: true, limit: 0 });

        if (languages.total_data === 0 || !languages.data) {
            return sendNotFoundData(res, 'Languages not found');
        }

        for (let i in excel.data) {
            let { locale, ...row } = excel.data[i];

            filterColumn(row, allowedKeys);
            filterData(row);

            if (Object.keys(row).length === 0) {
                continue;
            }

            let { category, intent } = row;

            if (isEmpty(category) || isEmpty(intent) || isEmpty(locale)) {
                continue;
            }

            if (/^[a-zA-Z]*$/.test(category) === false || /^[a-zA-Z ]*$/.test(intent) === false) {
                continue;
            }

            let languageData = languages.data.find((obj: Record<string, any>) =>
                obj.locale.toLowerCase() === locale.toLowerCase() && obj.is_active === true
            );

            if (!languageData) {
                continue;
            }

            data.push({
                ...row,
                category,
                intent,
                language_id: languageData.id,
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


export const trainData = async (req: Request, res: Response) => {
    const train = await trainNetwork();

    if (!train.success || !train.data) {
        return sendBadRequest(res, train.error);
    }

    const { data } = train;

    return sendSuccessCreated(res, { total_data: 1, data });
};
