import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
    username: Joi.string()
        .required(),
    password: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    lifetime: Joi.string()
        .required(),
    country: Joi.string()
        .required(),
    state: Joi.string()
        .required(),
    city: Joi.string()
        .required(),
    highEndPool: Joi.boolean()
        .required(),
});


export { schemaCredential, schemaConfig };
