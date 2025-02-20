import * as Joi from 'joi';


const schemaCredential = Joi.object({
    appKey: Joi.string()
        .required(),
    appSecret: Joi.string()
        .required(),
    consumerKey: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    projectId: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    flavorId: Joi.string()
        .required(),
    port: Joi.number()
        .required(),
    tag: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
