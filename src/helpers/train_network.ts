import path from 'path';
import { parentPort } from 'worker_threads';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { NlpManager } from 'node-nlp';
import * as entitiesModel from './../models/entities';
import * as faqAnswersModel from './../models/faq_answers';
import * as faqsModel from './../models/faqs';
import * as faqQuestionsModel from './../models/faq_questions';
import * as loggerHelper from './logger';
import { putContent } from './file';

interface Result {
    faqs: number;
    faq_questions: number;
    faq_answers: number;
    entities: number;
}

const fileSource = '/' + path.relative(process.cwd(), __filename);

const trainNetwork = async (): Promise<Result> => {
    let result: Result = { faqs: 0, faq_questions: 0, faq_answers: 0, entities: 0 };

    try {
        const faqs = await faqsModel.getAll({ is_active: 1, limit: 0 });
        const entities = await entitiesModel.getAll({ is_active: 1, limit: 0 })

        if (faqs.total_data > 0 && faqs.data) {
            result.faqs = faqs.total_data;

            let languages: string[] = faqs.data.map((row) => row.locale);
                languages = [...new Set(languages)];

            putContent('lang.json', JSON.stringify(languages));

            const manager = new NlpManager({ languages, autoSave: false });

            if (entities.total_data > 0 && entities.data) {
                result.entities += entities.total_data;

                for (let i in entities.data) {
                    let { category, intent, locale } = entities.data[i];
                    let sources: string[] = JSON.parse(entities.data[i].sources) || [];

                    manager.addNamedEntityText(category, intent, [locale], sources);
                }
            }

            for (let i in faqs.data) {
                let { id, category, intent, locale } = faqs.data[i];
                let faqQuestions = await faqQuestionsModel.getAll({ is_active: 1, limit: 0, faq_id: id });
                let faqAnswers = await faqAnswersModel.getAll({ is_active: 1, limit: 0, faq_id: id });

                if (faqQuestions.total_data > 0 && faqQuestions.data && intent !== 'none') {
                    result.faq_questions += faqQuestions.total_data;
                    faqQuestions.data.forEach((row) => manager.addDocument(locale, row.question, `${category}.${intent}`));
                }

                if (faqAnswers.total_data > 0 && faqAnswers.data) {
                    result.faq_answers += faqAnswers.total_data;
                    switch (intent) {
                        case 'none':
                            faqAnswers.data.forEach((row) => manager.addAnswer(locale, `${intent.charAt(0).toUpperCase() + intent.slice(1)}`, row.answer));
                            break;
                        default:
                            faqAnswers.data.forEach((row) => manager.addAnswer(locale, `${category}.${intent}`, row.answer));
                            break;
                    }
                }
            }

            await manager.train();
            manager.save('model.json');

            loggerHelper.event({
                source: fileSource,
                message: 'Trained model',
                data: {
                    faqs: result.faqs,
                    faqQuestions: result.faq_questions,
                    faqAnswers: result.faq_answers,
                    entities: result.entities
                } 
            });
        }
    } catch (err: any) {
        loggerHelper.error({
            source: fileSource,
            message: 'Failed to train',
            error: err
        });
    }

    return result;
};

trainNetwork().then((result: Result) => {
    parentPort?.postMessage({ success: true, data: result });
}).catch((err) => {
    parentPort?.postMessage({ success: false, error: err.message });
});
