import { workerData, parentPort } from "worker_threads";
import { NlpManager } from "node-nlp";
import * as faqsModel from "./../models/faqs";
import * as faqAnswersModel from "./../models/faq_answers";
import * as faqQuestionsModel from "./../models/faq_questions";
import * as logger from "./logger";

const trainNetwork = async (): Promise<number> => {
    try {
        const faqs = await faqsModel.getAll({ is_active: 1, limit: 0 });

        if (faqs.total_data > 0 && faqs.data) {
            let languages: string[] = faqs.data.map((row) => row.language_code);
                languages = [...new Set(languages)];
    
            const manager = new NlpManager({ languages });
    
            for (let i in faqs.data) {
                let { id, intent, faq_category, language_code } = faqs.data[i];
                let faqQuestions = await faqQuestionsModel.getAll({ is_active: 1, limit: 0, faq_id: id });
                let faqAnswers = await faqAnswersModel.getAll({ is_active: 1, limit: 0, faq_id: id });
    
                if (faqQuestions.total_data > 0 && faqQuestions.data) {
                    faqQuestions.data.forEach((row) => manager.addDocument(language_code, row.question, `${faq_category}.${intent}`));
                }
    
                if (faqAnswers.total_data > 0 && faqAnswers.data) {
                    faqAnswers.data.forEach((row) => manager.addAnswer(language_code, `${faq_category}.${intent}`, row.answer));
                }
            }
    
            await manager.train();
            manager.save();
    
            logger.success({
                from: 'train network',
                message: 'training network'
            });
        }

        return faqs.total_data;
    } catch (err) {
        return 0
    }
};

trainNetwork()
    .then((total: number) => {
        parentPort?.postMessage({ success: true, total });
    })
    .catch((err) => {
        parentPort?.postMessage({ success: false, error: err.message });
    });