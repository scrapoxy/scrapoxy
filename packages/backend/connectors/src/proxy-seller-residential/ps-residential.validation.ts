import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    countryCode: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    city: Joi.string()
        .required(),
    isp: Joi.string()
        .required(),
    title: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
