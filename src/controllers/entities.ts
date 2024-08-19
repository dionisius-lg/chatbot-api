import { Request, Response } from "express";
import { unlinkSync } from "fs";
import * as entitiesModel from "./../models/entities";
import * as languagesModel from "./../models/languages";
import { sendSuccess, sendSuccessCreated, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { readExcel, trainNetwork } from "./../helpers/thread";
import { filterColumn, filterData } from "./../helpers/request";
import { isEmpty } from "./../helpers/value";

export const getData = async (req: Request, res: Response) => {
    const { query } = req;
    let { total_data, data } = await entitiesModel.getAll(query);

    if (total_data > 0 && data) {
        data = data.map(row => (row.aliases = JSON.parse(row?.aliases) || [], row));
        return sendSuccess(res, { total_data, data });
    }

    return sendNotFoundData(res);
};

export const getDataById = async (req: Request, res: Response) => {
    const { params: { id } } = req;
    let { total_data, data } = await entitiesModel.getDetail({ id });

    if (total_data > 0 && data) {
        data.aliases = JSON.parse(data?.aliases) || [];
        return sendSuccess(res, { total_data, data });
    }

    return sendNotFoundData(res);
};

export const createData = async (req: Request, res: Response) => {
    let { body, decoded } = req;
    const language = await languagesModel.getDetail({ id: body?.language_id, is_active: 1 });

    if (language.total_data === 0 || !language.data) {
        return sendNotFoundData(res, 'Language not found');
    }

    body.aliases = JSON.stringify(body?.aliases) || [];
    body.created_by = decoded?.user_id || null;

    const result = await entitiesModel.insertData(body);

    if (result.data) {
        return sendSuccessCreated(res, result);
    }

    return sendBadRequest(res);
};

export const updateDataById = async (req: Request, res: Response) => {
    let { body, params: { id }, decoded } = req;

    if (body?.language_id) {
        const language = await languagesModel.getDetail({ id: body?.language_id, is_active: 1 });

        if (language.total_data === 0 || !language.data) {
            return sendNotFoundData(res, 'Language not found');
        }
    }

    if (body.aliases) {
        body.aliases = JSON.stringify(body.aliases);
    }

    body.update_by = decoded?.user_id || null;

    const result = await entitiesModel.updateData(body, { id });

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
        const allowedKeys = ['category', 'intent', 'locale', 'aliases'];

        unlinkSync(file.path);

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const languages = await languagesModel.getAll({ is_active: 1, limit: 0 });

        if (languages.total_data === 0 || !languages.data) {
            return sendNotFoundData(res, 'Languages not found');
        }

        for (let i in excel.data) {
            let { locale, ...row } = excel.data[i];

            filterColumn(row, allowedKeys);
            filterData(row);

            let { category, intent } = row;

            if (isEmpty(category) || isEmpty(intent) || isEmpty(locale)) {
                continue;
            }

            if (/^[a-zA-Z]*$/.test(category) === false || /^[a-zA-Z ]*$/.test(intent) === false) {
                continue;
            }

            let languageData = languages.data.find((obj: Record<string, any>) =>
                obj.locale.toLowerCase() === locale.toLowerCase() && obj.is_active === 1
            );

            if (!languageData) {
                continue;
            }

            let aliases: string[] = [intent];

            if (!isEmpty(row.aliases)) {
                row.aliases.split(',').forEach((item: any) => {
                    if (typeof item === 'string') {
                        let cleaned = item.replace(/[^a-zA-Z0-9]/g, '');

                        if (cleaned.length > 0) {
                            aliases.push(cleaned);
                        }
                    }
                });

                aliases = [...new Set(aliases)];
            }

            data.push({
                ...row,
                category,
                intent,
                language_id: languageData.id,
                aliases: JSON.stringify(aliases),
                created_by: decoded?.user_id || null
            });
        }
    }

    if (data.length > 0) {
        const result = await entitiesModel.insertManyData(data);

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