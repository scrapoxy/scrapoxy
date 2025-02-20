import * as Joi from 'joi';


const schemaCredential = Joi.object({
    secretId: Joi.string()
        .required(),
    secretKey: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    region: Joi.string()
        .required(),
    zone: Joi.string()
        .required(),
    port: Joi.number()
        .required(),
    instanceType: Joi.string()
        .required(),
    projectId: Joi.number()
        .allow('')
        .optional(),
    tag: Joi.string()
        .required(),
});


export { schemaConfig, schemaCredential };
