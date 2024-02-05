import * as Joi from 'joi';


const schemaCredential = Joi.object({
    email: Joi.string()
        .required()
        .email(),
    apiKey: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    packageFilter: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
