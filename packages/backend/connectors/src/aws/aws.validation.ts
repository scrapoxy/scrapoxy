import * as Joi from 'joi';


const schemaCredential = Joi.object({
    accessKeyId: Joi.string()
        .required(),
    secretAccessKey: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    region: Joi.string()
        .required(),
    port: Joi.number()
        .required(),
    instanceType: Joi.string()
        .required(),
    securityGroupName: Joi.string()
        .required(),
    tag: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
