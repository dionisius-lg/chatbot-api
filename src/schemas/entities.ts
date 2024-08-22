import Joi from "joi";

const schema = {
    detailById: Joi.object().keys({
        id: Joi.number().min(1).required(),
    }),
    createData: Joi.object().keys({
        category: Joi.string().min(1).max(50).regex(/^[a-zA-Z]*$/).required(),
        intent: Joi.string().min(1).max(50).regex(/^[a-zA-Z]*$/).required(),
        language_id: Joi.number().min(1).required(),
        sources: Joi.array().min(1).max(10).items(Joi.string().min(1).max(20).regex(/^[a-zA-Z0-9]*$/)),
    }),
    updateData: Joi.object().keys({
        category: Joi.string().min(1).max(50).regex(/^[a-zA-Z]*$/),
        intent: Joi.string().min(1).max(50).regex(/^[a-zA-Z]*$/),
        language_id: Joi.number().min(1),
        sources: Joi.array().min(1).max(10).items(Joi.string().min(1).max(20).regex(/^[a-zA-Z0-9]*$/)),
        is_active: Joi.number().valid(1, 0),
    }),
};

export default schema;