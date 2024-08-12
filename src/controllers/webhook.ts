import { Request, Response } from "express";
import moment from "moment-timezone";
import { NlpManager, Language } from "node-nlp";
import config from "./../config";
import * as faqAnswersModel from "./../models/faq_answers";
import { sendSuccess, sendNotFoundData, sendInternalServerError } from "./../helpers/response";
import { isEmpty } from "./../helpers/value";
import { getContent } from "./../helpers/file";

const { timezone } = config;

moment.tz.setDefault(timezone);

interface LangGuesser {
    alpha3: string;
    alpha2: string;
    language: string;
    score: number;
}

export const message = async (req: Request, res: Response) => {
    const { body } = req;

    try {
        let langContent = getContent('lang.txt');

        const languages: string[] = langContent && JSON.parse(langContent) || [];
        const manager = new NlpManager({ languages });
        const langGuesser: LangGuesser[] = new Language().guess(body.text, languages);

        manager.load('model.txt');

        let langGuessed: string = 'id';

        if (langGuesser.length > 0) {
            langGuessed = langGuesser[0].alpha2;
        }

        const managerProcess: Record<string, any> = await manager.process(langGuessed, body.text);

        if (isEmpty(managerProcess.answer)) {
            const faqAnswers = await faqAnswersModel.getAll({ is_active: 1, limit: 0, intent: 'none' });

            if (faqAnswers.total_data === 0 || !faqAnswers.data) {
                return sendNotFoundData(res);
            }

            const answers = faqAnswers.data.map((row) => row.answer);
            const randomIndex = Math.floor(Math.random() * answers.length);

            managerProcess.answer = answers[randomIndex];
        }

        const data = {
            locale: managerProcess.locale,
            question: managerProcess.utterance,
            answer: managerProcess.answer,
            sentiment: managerProcess.sentiment
        };

        return sendSuccess(res, { total_data: 1, data });
    } catch (err: any) {
        console.error(err);
        return sendInternalServerError(res);
    }
};