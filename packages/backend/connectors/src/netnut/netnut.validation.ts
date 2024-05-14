import * as Joi from 'joi';
import { EConnectorNetnutProxyType } from './netnut.interface';


const schemaCredential = Joi.object({
    username: Joi.string()
        .required(),
    password: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    proxyType: Joi.string()
        .valid(...Object.values(EConnectorNetnutProxyType))
        .required(),
    country: Joi.string()
        .required(),
});


export { schemaCredential, schemaConfig };
