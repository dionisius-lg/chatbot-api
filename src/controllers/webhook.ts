import { Request, Response } from "express";
import moment from "moment-timezone";
import { NlpManager, Language } from "node-nlp";
import config from "./../config";
import * as faqsModel from "./../models/faqs";
import { sendSuccess, sendBadRequest } from "./../helpers/response";

const { timezone } = config;

moment.tz.setDefault(timezone);

interface Languages {
    alpha3: string;
    alpha2: string;
    language: string;
    score: number;
}

export const inbound = async (req: Request, res: Response) => {
    const { body } = req;

    try {
        let manager = new NlpManager();
            manager.load('model.nlp');

        const languages: Languages[] = new Language().guess(body.text);
        let language: string = 'en';

        if (languages.length > 0) {
            language = languages[0].alpha2;
        }

        const process = await manager.process(language, body.text);

        return sendSuccess(res, { answer: process.answer });
    } catch (err: any) {
        return sendBadRequest(res);
    }
};