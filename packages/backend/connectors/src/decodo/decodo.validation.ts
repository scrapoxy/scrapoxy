import { DECODO_PRODUCT_TYPES } from '@scrapoxy/common';
import * as Joi from 'joi';


const schemaCredential = Joi.object({
    credentialType: Joi.string()
        .required()
        .valid(...DECODO_PRODUCT_TYPES),
    username: Joi.string()
        .required(),
    password: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    country: Joi.string()
        .required(),
    sessionDuration: Joi.number()
        .required()
        .min(1)
        .max(1440),
});


export { schemaCredential, schemaConfig };
