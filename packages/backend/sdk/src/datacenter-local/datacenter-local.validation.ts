import * as Joi from 'joi';


export const schemaSubscriptionDatacenterLocalToUpdate = Joi.object({
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


export const schemaSubscriptionDatacenterLocalToCreate = Joi.object({
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


export const schemaImageDatacenterLocalToUpdate = Joi.object({
    certificate: Joi.object()
        .required(),
});


export const schemaImageDatacenterLocalToCreate = Joi.object({
    id: Joi.string()
        .required(),
    certificate: Joi.object()
        .required(),
});


export const schemaInstancesDatacenterLocalToCreate = Joi.object({
    ids: Joi.array()
        .items(Joi.string())
        .min(1)
        .required(),
    imageId: Joi.string()
        .required(),
    size: Joi.string()
        .required(),
});
