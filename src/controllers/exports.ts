import { Request, Response } from "express";
import * as faqCategoriesModel from "./../models/faq_categories";
import * as faqsModel from "./../models/faqs";
import * as languagesModel from "./../models/languages";
import { sendSuccess, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { createExcel } from "./../helpers/thread";
import { encrypt } from "./../helpers/encryption";

export const getFaqCategories = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await faqCategoriesModel.getAll({ ...query, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            name: 'Name',
            is_active: 'Is Active',
            created: 'Created',
            created_user: 'Created By',
            updated: 'Updated',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'report-faq-categories' });

        if (!excel.success) {
            return sendBadRequest(res, excel.error);
        }

        const filedata = {
            filename: excel.filename,
            filepath: excel.filepath,
            filesize: excel.filesize,
            mimetype: excel.mimetype
        };

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
            faq_category: 'FAQ Category',
            language: 'Languange',
            is_active: 'Is Active',
            created: 'Created',
            created_user: 'Created By',
            updated: 'Updated',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'report-faqs' });

        if (!excel.success) {
            return sendBadRequest(res, excel.error);
        }

        const filedata = {
            filename: excel.filename,
            filepath: excel.filepath,
            filesize: excel.filesize,
            mimetype: excel.mimetype
        };

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
            code: 'Code',
            native_name: 'Native Name',
            is_active: 'Is Active',
            created: 'Created',
            updated: 'Updated'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'report-languages' });

        if (!excel.success) {
            return sendBadRequest(res, excel.error);
        }

        const filedata = {
            filename: excel.filename,
            filepath: excel.filepath,
            filesize: excel.filesize,
            mimetype: excel.mimetype
        };

        const encrypted = encrypt(JSON.stringify(filedata));
        const protocol = secure ? 'https' : 'http';
        const link = `${protocol}://${host}/files/${encrypted}`;

        return sendSuccess(res, { total_data: 1, data: { link }});
    }

    return sendNotFoundData(res);
};