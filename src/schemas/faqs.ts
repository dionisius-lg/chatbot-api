import Joi from "joi";

const schema = {
    detailById: Joi.object().keys({
        id: Joi.number().min(1).required(),
    }),
    createData: Joi.object().keys({
        category: Joi.string().min(1).max(50).regex(/^[a-zA-Z\_]*$/).required(),
        intent: Joi.string().min(1).max(50).regex(/^[a-zA-Z\_]*$/).required(),
        language_id: Joi.number().min(1).required(),
    }),
    updateData: Joi.object().keys({
        category: Joi.string().min(1).max(50).regex(/^[a-zA-Z\_]*$/),
        intent: Joi.string().min(1).max(50).regex(/^[a-zA-Z\_]*$/),
        language_id: Joi.number().min(1),
        is_active: Joi.boolean(),
    }),
};

export default schema;
