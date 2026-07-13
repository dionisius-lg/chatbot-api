import Joi from "joi";

const schema = {
    chat: Joi.object().keys({
        message: Joi.string().min(1).required(),
    }),
};

export default schema;
