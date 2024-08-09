import Joi from "joi";

const schema = {
    detailById: Joi.object().keys({
        id: Joi.number().min(1).required(),
    }),
    createData: Joi.object().keys({
        question: Joi.string().min(1).max(255).required(),
        faq_id: Joi.number().min(1).required(),
    }),
    updateData: Joi.object().keys({
        question: Joi.string().min(1).max(255),
        faq_id: Joi.number().min(1),
        is_active: Joi.number().valid(1, 0),
    }),
};

export default schema;