import { Request, Response } from 'express';
import * as entitiesModel from './../models/entities';
import * as faqsModel from './../models/faqs';
import * as faqAnswersModel from './../models/faq_answers';
import * as faqQuestionsModel from './../models/faq_questions';
import * as languagesModel from './../models/languages';
import * as usersModel from './../models/users';
import { sendSuccess, sendBadRequest, sendNotFoundData } from './../helpers/response';
import { createExcel } from './../helpers/thread';
import { encrypt } from './../helpers/encryption';

export const getEntities = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await entitiesModel.getAll({ ...query, limit: 0, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            category: 'Category',
            intent: 'Intent',
            sources: 'Sources',
            language: 'Language',
            language_native: 'Language Native',
            locale: 'Locale',
            is_active: 'Is Active',
            created_at: 'Created At',
            created_user: 'Created By',
            updated_at: 'Updated At',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'entities', subpath: 'export '});

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
}

export const getFaqs = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await faqsModel.getAll({ ...query, limit: 0, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            intent: 'Intent',
            language: 'Language',
            language_native: 'Language Native',
            locale: 'Locale',
            is_active: 'Is Active',
            created_at: 'Created At',
            created_user: 'Created By',
            updated_at: 'Updated At',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'faqs', subpath: 'export' });

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

export const getFaqAnswers = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await faqAnswersModel.getAll({ ...query, limit: 0, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            answer: 'Answer',
            intent: 'Intent',
            language: 'Language',
            language_native: 'Language Native',
            locale: 'Locale',
            is_active: 'Is Active',
            created_at: 'Created At',
            created_user: 'Created By',
            updated_at: 'Updated At',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'faq-answers', subpath: 'export' });

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

export const getFaqQuestions = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await faqQuestionsModel.getAll({ ...query, limit: 0, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            question: 'Question',
            intent: 'Intent',
            language: 'Language',
            language_native: 'Language Native',
            locale: 'Locale',
            is_active: 'Is Active',
            created_at: 'Created At',
            created_user: 'Created By',
            updated_at: 'Updated At',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'faq-questions', subpath: 'export' });

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
    const { data } = await languagesModel.getAll({ ...query, limit: 0, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            name: 'Name',
            native_name: 'Native Name',
            locale: 'Locale',
            is_active: 'Is Active',
            created_at: 'Created At',
            updated_at: 'Updated At'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'languages', subpath: 'export' });

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

export const getUsers = async (req: Request, res: Response) => {
    const { query, secure } = req;
    const host = req.get('host');
    const { data } = await usersModel.getAll({ ...query, limit: 0, is_export: 1 });

    if (data && data.length > 0) {
        const columndata = {
            no: 'No',
            username: 'Username',
            fullname: 'Fullname',
            is_active: 'Is Active',
            created_at: 'Created At',
            created_user: 'Created By',
            updated_at: 'Updated At',
            updated_user: 'Updated By'
        };

        const excel = await createExcel({ columndata, rowdata: data, filename: 'users', subpath: 'export' });

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
