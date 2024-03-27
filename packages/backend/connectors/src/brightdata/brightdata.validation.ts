import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    zone: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
