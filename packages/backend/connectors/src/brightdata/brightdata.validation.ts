import { BRIGHTDATA_PRODUCT_TYPES } from '@scrapoxy/common';
import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    zoneName: Joi.string()
        .required(),
    productType: Joi.string()
        .required()
        .valid(...BRIGHTDATA_PRODUCT_TYPES),
    username: Joi.string()
        .required(),
    password: Joi.string()
        .required(),
    country: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
