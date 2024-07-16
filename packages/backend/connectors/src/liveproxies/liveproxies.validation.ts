import * as Joi from 'joi';


const schemaCredential = Joi.object({
    apiKey: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    packageId: Joi.number()
        .required(),
    productName: Joi.string()
        .required(),
    country: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
