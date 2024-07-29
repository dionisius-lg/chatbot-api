import Joi from "joi";

const schema = {
    download: Joi.object().keys({
        id: Joi.string().min(1).required(),
    }),
};

export default schema;