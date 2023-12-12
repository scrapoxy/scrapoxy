import * as Joi from 'joi';


const schemaHardwareCredential = Joi.object({
    proxyUsername: Joi.string()
        .required(),
    proxyPassword: Joi.string()
        .required(),
});


export { schemaHardwareCredential };
