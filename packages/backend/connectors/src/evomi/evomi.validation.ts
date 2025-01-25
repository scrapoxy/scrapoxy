import { EVOMI_PRODUCTS } from '@scrapoxy/common';
import * as Joi from 'joi';


const schemaCredential = Joi.object({
    apiKey: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    product: Joi.string()
        .required()
        .valid(...EVOMI_PRODUCTS),
    hostname: Joi.string()
        .optional()
        .allow(null),
    port: Joi.number()
        .optional(),
    username: Joi.string()
        .optional()
        .allow(null),
    password: Joi.string()
        .optional()
        .allow(null),
    country: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
