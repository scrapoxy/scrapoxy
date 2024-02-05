import { schemaHardwareCredential } from '@scrapoxy/backend-sdk';
import * as Joi from 'joi';


const schemaCredential = schemaHardwareCredential.keys({
    apiUrl: Joi.string()
        .required()
        .uri(),
    apiToken: Joi.string()
        .required(),
    proxyHostname: Joi.string()
        .required(),
});

export { schemaCredential };
