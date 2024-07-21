import Joi from "joi";

const schema = {
    auth: Joi.object().keys({
        username: Joi.string().min(1).required(),
        password: Joi.string().min(1).required(),
    }),
};

export default schema;