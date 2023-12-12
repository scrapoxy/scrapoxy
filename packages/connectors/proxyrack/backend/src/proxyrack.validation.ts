import * as Joi from 'joi';
import {
    EProxyrackOs,
    EProxyrackProductType,
} from './proxyrack.interface';


const schemaCredential = Joi.object({
    product: Joi.string()
        .valid(...Object.values(EProxyrackProductType))
        .required(),
    username: Joi.string()
        .required(),
    password: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    country: Joi.string()
        .required(),
    city: Joi.string()
        .required(),
    isp: Joi.string()
        .required(),
    osName: Joi.string()
        .valid(...Object.values(EProxyrackOs))
        .required(),
});

export { schemaCredential, schemaConfig };
