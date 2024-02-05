import * as Joi from 'joi';


const azureNamePattern = new RegExp(
    '^[a-z0-9_]+$',
    'i'
);
const schemaCredential = Joi.object({
    tenantId: Joi.string()
        .required(),
    clientId: Joi.string()
        .required(),
    secret: Joi.string()
        .required(),
    subscriptionId: Joi.string()
        .required(),
});
const schemaConfig = Joi.object({
    location: Joi.string()
        .required(),
    port: Joi.number()
        .required(),
    resourceGroupName: Joi.string()
        .pattern(azureNamePattern)
        .required(),
    vmSize: Joi.string()
        .required(),
    storageAccountType: Joi.string()
        .required(),
    prefix: Joi.string()
        .required(),
    imageResourceGroupName: Joi.string()
        .pattern(azureNamePattern)
        .required(),
});


export { schemaCredential, schemaConfig };
