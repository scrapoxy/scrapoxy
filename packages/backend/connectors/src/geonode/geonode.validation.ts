import { GEONODE_PRODUCT_TYPES } from '@scrapoxy/common';
import * as Joi from 'joi';


const schemaCredential = Joi.object({
    username: Joi.string()
        .required(),
    password: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    productType: Joi.string()
        .required()
        .valid(...GEONODE_PRODUCT_TYPES),
    country: Joi.string()
        .required(),
    lifetime: Joi.number()
        .required()
        .min(3) // 3 minutes
        .max(1440), // 24h
});


export { schemaCredential, schemaConfig };
