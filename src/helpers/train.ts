import * as faqsModel from "./../models/faqs";
import * as faqAnswersModel from "./../models/faq_answers";
import * as faqQuestionsModel from "./../models/faq_questions";
import { NlpManager } from "node-nlp";

const train = async () => {
    const faqs = await faqsModel.getAll({ is_active: 1, limit: 0 });

    if (faqs.total_data > 0) {
        let languages: string[] = faqs.data.map((row: Record<string, any>) => row.language_code);
            languages = [...new Set(languages)];

        const manager = new NlpManager({ languages });

        for (let i in faqs.data) {
            let { intent, faq_category, language_code } = faqs.data[i];
            let faqQuestions = await faqQuestionsModel.getAll({ is_active: 1, limit: 0, faq_id: faqs.data[i].id});

            if (faqQuestions.total_data > 0) {
                faqQuestions.data.forEach((row: Record<string, any>) => {
                    manager.addDocument(language_code, row.question, `${faq_category}.${intent}`);
                });
            }

            let faqAnswers = await faqAnswersModel.getAll({ is_active: 1, limit: 0, faq_id: faqs.data[i].id});

            if (faqAnswers.total_data > 0) {
                faqAnswers.data.forEach((row: Record<string, any>) => {
                    manager.addAnswer(language_code, `${faq_category}.${intent}`, row.answer);
                });
            }
        }

        await manager.train();
        manager.save();
    }
}

train();

export default train;