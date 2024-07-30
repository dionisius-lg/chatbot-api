import { Request, Response } from "express";
import moment from "moment-timezone";
import { NlpManager, Language } from "node-nlp";
import config from "./../config";
import * as faqsModel from "./../models/faqs";
import * as responseHelper from "./../helpers/response";
import * as logger from "./../helpers/logger";
import { readContent } from "./../helpers/file";

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

    const faqs = await faqsModel.getAll({ is_active: 1, limit: 0 });

    if (faqs.total_data > 0) {
        let languages: string[] = faqs.data.map((row: Record<string, any>) => row.language_code);
            languages = [...new Set(languages)];

        const manager = new NlpManager({ languages });
              manager.load('model.nlp');

        const langs: Langs[] = new Language().guess(body.text);
        let lang: string = 'en';

        if (langs.length > 0) {
            lang = langs[0].alpha2;
        }

        const process = await manager.process('en', body.text);

        return responseHelper.sendSuccess(res, { answer: process.answer });
    }

    return res.json('not found')
}