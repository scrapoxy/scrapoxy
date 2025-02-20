import * as Joi from 'joi';


const schemaCredential = Joi.object({
    secretAccessKey: Joi.string()
        .required(),
    projectId: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    region: Joi.string()
        .required(),
    port: Joi.number()
        .required(),
    instanceType: Joi.string()
        .required(),
    tag: Joi.string()
        .required(),
});


export { schemaConfig, schemaCredential };
