import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    region: Joi.string()
        .required(),
    port: Joi.number()
        .required(),
    size: Joi.string()
        .required(),
    tag: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
