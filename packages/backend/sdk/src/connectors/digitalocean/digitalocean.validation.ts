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
    snapshotId: Joi.string()
        .allow('')
        .optional(),
    tag: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
