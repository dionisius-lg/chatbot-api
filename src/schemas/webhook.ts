import Joi from "joi";

const schema = {
    message: Joi.object().keys({
        text: Joi.string().min(1).required(),
    }),
};

export default schema;