import { statSync, existsSync } from 'fs';
import { Request, Response } from 'express';
import moment from 'moment-timezone';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { NlpManager, Language } from 'node-nlp';
import config from './../config';
import * as faqAnswersModel from './../models/faq_answers';
import { sendSuccess, sendNotFoundData, sendInternalServerError } from './../helpers/response';
import { isEmpty } from './../helpers/value';
import { getContent } from './../helpers/file';

const { timezone } = config;

moment.tz.setDefault(timezone);

interface LangGuesser {
    alpha3: string;
    alpha2: string;
    language: string;
    score: number;
}

interface ManagerProcessed {
    locale: string;
    utterance: string;
    answer: string;
    sentiment: Record<string, string | number>;
    entities?: Record<string, string | number>[];
}

let cachedManager: any = null;
let cachedLanguages: string[] = [];
let cachedModelMtime: number = 0;
let cachedLangMtime: number = 0;

/**
 * Retrieves the NlpManager instance and languages array, reloading them from disk if either lang.json or model.json was modified.
 * 
 * @returns {{ manager: any, languages: string[] }} The updated or cached manager and languages list.
 */
function getOrUpdateNlpManager(): { manager: any, languages: string[] } {
    const modelPath = 'model.json';
    const langPath = 'lang.json';

    let modelMtime = 0;
    let langMtime = 0;

    if (existsSync(modelPath)) {
        modelMtime = statSync(modelPath).mtimeMs;
    }
    if (existsSync(langPath)) {
        langMtime = statSync(langPath).mtimeMs;
    }

    if (cachedManager && cachedModelMtime === modelMtime && cachedLangMtime === langMtime) {
        return { manager: cachedManager, languages: cachedLanguages };
    }

    const langContent = getContent(langPath);
    const languages: string[] = langContent && JSON.parse(langContent) || [];
    const manager = new NlpManager({ languages });

    if (existsSync(modelPath)) {
        manager.load(modelPath);
    }

    cachedManager = manager;
    cachedLanguages = languages;
    cachedModelMtime = modelMtime;
    cachedLangMtime = langMtime;

    return { manager, languages };
}

export const chat = async (req: Request, res: Response) => {
    const { body } = req;

    try {
        const { manager, languages } = getOrUpdateNlpManager();
        const langGuesser: LangGuesser[] = new Language().guess(body.message, languages);

        let langGuessed: string = 'id';

        if (langGuesser.length > 0) {
            langGuessed = langGuesser[0].alpha2;
        }

        const managerProcessed: ManagerProcessed = await manager.process(langGuessed, body.message);
        let { locale, utterance, answer, sentiment, entities } = managerProcessed;

        if (isEmpty(answer)) {
            const faqAnswers = await faqAnswersModel.getAll({ is_active: 1, limit: 0, intent: 'none' });

            if (faqAnswers.total_data === 0 || !faqAnswers.data) {
                return sendNotFoundData(res);
            }

            const answers = faqAnswers.data.map((row) => row.answer);
            const randomIndex = Math.floor(Math.random() * answers.length);

            answer = answers[randomIndex];
        }

        if (entities && !isEmpty(entities)) {
            const entity = entities.reduce((acc, item) => {
                if (!acc[item.entity]) {
                    acc[item.entity] = item.sourceText;
                }

                return acc;
            }, {});

            answer = answer.replace(/%(\w+)%/g, (_, word) => entity[word] || word);
        }

        const data = {
            locale: locale,
            question: utterance,
            answer: answer,
            sentiment: sentiment
        };

        return sendSuccess(res, { total_data: 1, data });
    } catch (err: any) {
        console.error(err);
        return sendInternalServerError(res);
    }
};
