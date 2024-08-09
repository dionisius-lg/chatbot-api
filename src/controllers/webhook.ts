import { Request, Response } from "express";
import moment from "moment-timezone";
import { NlpManager, Language } from "node-nlp";
import config from "./../config";
import * as faqsModel from "./../models/faqs";
import { sendSuccess, sendBadRequest } from "./../helpers/response";

const { timezone } = config;

moment.tz.setDefault(timezone);

interface Langs {
    alpha3: string;
    alpha2: string;
    language: string;
    score: number;
}

export const inbound = async (req: Request, res: Response) => {
    const { body } = req;

    try {
        const faqs = await faqsModel.getAll({ is_active: 1, limit: 0 });

        if (faqs.total_data > 0 && faqs.data) {
            let languages: string[] = faqs.data.map((row: Record<string, any>) => row.language_code);
                languages = [...new Set(languages)];

            let manager = new NlpManager({ languages });
                manager.load('model.nlp');

            const langs: Langs[] = new Language().guess(body.text);
            let lang: string = 'en';

            if (langs.length > 0) {
                lang = langs[0].alpha2;
            }

            const process = await manager.process(lang, body.text);

            return sendSuccess(res, { answer: process.answer });
        }

        return sendSuccess(res, { answer: 'null' });
    } catch (err: any) {
        return sendBadRequest(res);
    }
};