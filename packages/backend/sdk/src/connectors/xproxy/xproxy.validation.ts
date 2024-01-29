import * as Joi from 'joi';
import { schemaHardwareCredential } from '../../transports';


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
