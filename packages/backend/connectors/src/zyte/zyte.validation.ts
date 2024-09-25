import { ZYTE_PRODUCT_TYPES } from '@scrapoxy/common';
import * as Joi from 'joi';


const schemaCredential = Joi.object({
    credentialType: Joi.string()
        .required()
        .valid(...ZYTE_PRODUCT_TYPES),
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
