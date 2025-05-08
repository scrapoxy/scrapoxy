import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    productId: Joi.number()
        .required(),
    country: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
