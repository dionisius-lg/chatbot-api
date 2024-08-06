import Joi from "joi";

const schema = {
    detailById: Joi.object().keys({
        id: Joi.number().min(1).required(),
    }),
};

export default schema;