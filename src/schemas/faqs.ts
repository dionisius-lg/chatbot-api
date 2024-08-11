import Joi from "joi";

const schema = {
    detailById: Joi.object().keys({
        id: Joi.number().min(1).required(),
    }),
    createData: Joi.object().keys({
        intent: Joi.string().min(1).max(50).required(),
        language_id: Joi.number().min(1).required(),
    }),
    updateData: Joi.object().keys({
        intent: Joi.string().min(1).max(50),
        language_id: Joi.number().min(1),
        is_active: Joi.number().valid(1, 0),
    }),
};

export default schema;