import { Request, Response } from "express";
import * as faqsModel from "./../models/faqs";
import { sendSuccess, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { createExcel } from "./../helpers/thread";
import { encrypt } from "./../helpers/encryption";

export const getDataFaqs = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const faqs = await faqsModel.getAll({ ...query, is_export: 1 });

    if (faqs.total_data > 0 && faqs.data) {
        const columndata = {
            no: 'No',
            intent: 'Intent',
            faq_category: 'FAQ Category',
            language: 'Languange'
        };

        const excel = await createExcel({ columndata, rowdata: faqs.data, filename: 'report-faqs' });

        if (!excel.success) {
            return sendBadRequest(res, excel.error);
        }

        const data = {
            filename: excel.filename,
            filepath: excel.filepath,
            filesize: excel.filesize,
            mimetype: excel.mimetype
        };

        const encrypted = encrypt(JSON.stringify(data));
        const protocol = secure ? 'https' : 'http';
        const link = `${protocol}://${host}/files/${encrypted}`;

        return sendSuccess(res, { total_data: 1, data: { link }});
    }

    return sendNotFoundData(res);
};