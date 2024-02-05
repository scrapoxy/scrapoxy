import { schemaHardwareCredential } from '@scrapoxy/backend-sdk';
import * as Joi from 'joi';


const schemaCredential = schemaHardwareCredential.keys({
    apiUrl: Joi.string()
        .required()
        .uri(),
    apiUsername: Joi.string()
        .required(),
    apiPassword: Joi.string()
        .required(),
    proxyHostname: Joi.string()
        .required(),
});

export { schemaCredential };
