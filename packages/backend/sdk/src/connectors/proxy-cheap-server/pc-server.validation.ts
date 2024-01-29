import * as Joi from 'joi';
import { EProxyCheapNetworkType } from './pc-server.interface';


const schemaCredential = Joi.object({
    key: Joi.string()
        .required(),
    secret: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    networkType: Joi.string()
        .valid(...Object.values(EProxyCheapNetworkType))
        .required(),
});


export { schemaCredential, schemaConfig };
