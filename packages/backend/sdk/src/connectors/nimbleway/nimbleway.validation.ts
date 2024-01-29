import * as Joi from 'joi';


const schemaCredential = Joi.object({
    username: Joi.string()
        .required(),
    password: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    country: Joi.string()
        .required(),
});

export { schemaCredential, schemaConfig };
