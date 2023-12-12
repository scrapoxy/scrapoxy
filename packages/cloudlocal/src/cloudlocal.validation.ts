import * as Joi from 'joi';


export const schemaSubscriptionCloudlocalToUpdate = Joi.object({
    instancesLimit: Joi.number()
        .required()
        .min(0),
    installDelay: Joi.number()
        .required()
        .min(0),
    startingDelay: Joi.number()
        .required()
        .min(0),
    stoppingDelay: Joi.number()
        .required()
        .min(0),
    transitionStartingToStarted: Joi.boolean()
        .required(),
    transitionStoppingToStopped: Joi.boolean()
        .required(),
});


export const schemaSubscriptionCloudlocalToCreate = Joi.object({
    id: Joi.string()
        .required(),
    instancesLimit: Joi.number()
        .required()
        .min(0),
    installDelay: Joi.number()
        .required()
        .min(0),
    startingDelay: Joi.number()
        .required()
        .min(0),
    stoppingDelay: Joi.number()
        .required()
        .min(0),
    transitionStartingToStarted: Joi.boolean()
        .required(),
    transitionStoppingToStopped: Joi.boolean()
        .required(),
});


export const schemaImageCloudlocalToUpdate = Joi.object({
    certificate: Joi.object()
        .required(),
});


export const schemaImageCloudlocalToCreate = Joi.object({
    id: Joi.string()
        .required(),
    certificate: Joi.object()
        .required(),
});


export const schemaInstancesCloudlocalToCreate = Joi.object({
    ids: Joi.array()
        .items(Joi.string())
        .min(1)
        .required(),
    imageId: Joi.string()
        .required(),
    size: Joi.string()
        .required(),
});
