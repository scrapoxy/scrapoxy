import * as Joi from 'joi';


const schemaCredential = Joi.object({
    projectId: Joi.string()
        .required(),
    clientEmail: Joi.string()
        .required(),
    privateKeyId: Joi.string()
        .required(),
    privateKey: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    zone: Joi.string()
        .required(),
    port: Joi.number()
        .required(),
    machineType: Joi.string()
        .required(),
    templateName: Joi.string()
        .required(),
    networkName: Joi.string()
        .required(),
    label: Joi.string()
        .required(),
    firewallName: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
