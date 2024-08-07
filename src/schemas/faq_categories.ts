import Joi from "joi";

const schema = {
    detailById: Joi.object().keys({
        id: Joi.number().min(1).required(),
    }),
    createData: Joi.object().keys({
        name: Joi.string().min(1).max(50).required(),
    }),
    updateData: Joi.object().keys({
        name: Joi.string().min(1).max(50),
        is_active: Joi.number().valid(1, 0),
    }),
};

export default schema;