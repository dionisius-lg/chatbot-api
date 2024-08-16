import { Request, Response } from "express";
import * as faqAnswersModel from "./../models/faq_answers";
import * as faqsModel from "./../models/faqs";
import * as languagesModel from "./../models/languages";
import { sendSuccess, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { createExcel } from "./../helpers/thread";
import { encrypt } from "./../helpers/encryption";

export const getFaqAnswers = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await faqAnswersModel.getAll({ ...query, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            answer: 'Answer',
            intent: 'Intent',
            language: 'Language',
            language_native: 'Language Native',
            locale: 'Locale',
            is_active: 'Is Active',
            created: 'Created',
            created_user: 'Created By',
            updated: 'Updated',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'report-faq-answers', subpath: 'export' });

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const { destination, ...filedata } = excel.data;
        const encrypted = encrypt(JSON.stringify(filedata));
        const protocol = secure ? 'https' : 'http';
        const link = `${protocol}://${host}/files/${encrypted}`;

        return sendSuccess(res, { total_data: 1, data: { link }});
    }

    return sendNotFoundData(res);
};

export const getFaqs = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await faqsModel.getAll({ ...query, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            intent: 'Intent',
            language: 'Language',
            language_native: 'Language Native',
            locale: 'Locale',
            is_active: 'Is Active',
            created: 'Created',
            created_user: 'Created By',
            updated: 'Updated',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'report-faqs', subpath: 'export' });

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const { destination, ...filedata } = excel.data;
        const encrypted = encrypt(JSON.stringify(filedata));
        const protocol = secure ? 'https' : 'http';
        const link = `${protocol}://${host}/files/${encrypted}`;

        return sendSuccess(res, { total_data: 1, data: { link }});
    }

    return sendNotFoundData(res);
};

export const getLanguages = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await languagesModel.getAll({ ...query, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            name: 'Name',
            native_name: 'Native Name',
            locale: 'Locale',
            is_active: 'Is Active',
            created: 'Created',
            updated: 'Updated'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'report-languages', subpath: 'export' });

        if (!excel.success || !excel.data) {
            return sendBadRequest(res, excel.error);
        }

        const { destination, ...filedata } = excel.data;
        const encrypted = encrypt(JSON.stringify(filedata));
        const protocol = secure ? 'https' : 'http';
        const link = `${protocol}://${host}/files/${encrypted}`;

        return sendSuccess(res, { total_data: 1, data: { link }});
    }

    return sendNotFoundData(res);
};