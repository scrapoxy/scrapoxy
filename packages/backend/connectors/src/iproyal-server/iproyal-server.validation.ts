import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    product: Joi.string()
        .required(),
    country: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
