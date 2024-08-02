import { Request, Response } from "express";
import * as faqsModel from "./../models/faqs";
import { sendSuccess, sendBadRequest, sendNotFoundData } from "./../helpers/response";
import { createExcel } from "./../helpers/thread";
import { encrypt } from "./../helpers/encryption";

export const getDataFaqs = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const faqs = await faqsModel.getAll(query);

    if (faqs.total_data > 0) {
        const columndata = {
            no: 'No',
            intent: 'Intent',
            faq_category: 'FAQ Category',
            language: 'Languange'
        };

        const report = await createExcel({ columndata, rowdata: faqs.data, filename: 'report-faqs' });

        if (!report.success) {
            return sendBadRequest(res, report.error);
        }

        const data = {
            filename: report.filename,
            filepath: report.filepath,
            filesize: report.filesize,
            mimetype: report.mimetype
        };

        const encrypted = encrypt(JSON.stringify(data));
        const protocol = secure ? 'https' : 'http';
        const link = `${protocol}://${host}/files/${encrypted}`;

        return sendSuccess(res, { total_data: 1, data: { link }});
    }

    return sendNotFoundData(res);
};