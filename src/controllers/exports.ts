import { Request, Response } from "express";
import * as faqsModel from "./../models/faqs";
import * as responseHelper from "./../helpers/response";
import { createExcel } from "./../helpers/thread";

export const getDataFaqs = async (req: Request, res: Response) => {
    const { query } = req;
    const faqs = await faqsModel.getAll(query);

    if (faqs.total_data > 0) {
        const columndata = {
            no: 'No',
            intent: 'Intent',
            faq_category: 'FAQ Category',
            language: 'Languange'
        };

        const report = await createExcel({ columndata, rowdata: faqs.data, filename: 'report-faqs' });

        if (report.success) {
            return responseHelper.sendSuccess(res, {
                total_data: 1,
                data: {
                    filename: report.filename,
                    path: report.path,
                    size: report.size,
                    mime: report.mime
                }
            });
        }
        
        return responseHelper.sendBadRequest(res, report.error);
    }

    return responseHelper.sendNotFoundData(res);
};