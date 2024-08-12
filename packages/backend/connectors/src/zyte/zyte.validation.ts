import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    region: Joi.string()
        .required(),
    apiUrl: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
