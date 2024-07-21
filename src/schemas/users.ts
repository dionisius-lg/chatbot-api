import Joi from "joi";

const schema = {
    detailById: Joi.object().keys({
        id: Joi.number().min(1).required(),
    }),
    createData: Joi.object().keys({
        username: Joi.string().min(1).max(20).required(),
        password: Joi.string().min(1).max(20).required(),
        fullname: Joi.string().min(1).max(50),
        is_active: Joi.number().valid(1, 0),
    }),
    updateData: Joi.object().keys({
        username: Joi.string().min(1).max(20),
        password: Joi.string().min(1).max(20),
        fullname: Joi.string().min(1).max(50),
        is_active: Joi.number().valid(1, 0),
    }),
};

export default schema;