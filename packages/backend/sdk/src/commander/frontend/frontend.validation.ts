import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import * as Joi from 'joi';


export const schemaProjectToCreate = Joi.object({
    name: Joi.string()
        .required(),
    autoRotate: Joi.boolean()
        .required(),
    autoRotateDelayRange: Joi.object({
        min: Joi.number()
            .required()
            .min(ONE_SECOND_IN_MS * 30),
        max: Joi.number()
            .required()
            .min(Joi.ref('min')),
    }),
    autoScaleUp: Joi.boolean()
        .required(),
    autoScaleDown: Joi.boolean()
        .required(),
    autoScaleDownDelay: Joi.number()
        .required()
        .min(ONE_SECOND_IN_MS * 30),
    cookieSession: Joi.boolean()
        .required(),
    mitm: Joi.boolean()
        .required(),
    proxiesMin: Joi.number()
        .required()
        .min(1),
    useragentOverride: Joi.boolean()
        .required(),
});


export const schemaProjectToUpdate = schemaProjectToCreate;


export const schemaProjectUserEmailToAdd = Joi
    .string()
    .required();


export const schemaCredentialToCreate = Joi.object({
    name: Joi.string()
        .required(),
    type: Joi.string()
        .required(),
    config: Joi.any()
        .required(),
});


export const schemaCredentialToUpdate = Joi.object({
    name: Joi.string()
        .required(),
    config: Joi.any()
        .required(),
});


export const schemaConnectorToCreate = Joi.object({
    name: Joi.string()
        .required(),
    credentialId: Joi.string()
        .required(),
    proxiesMax: Joi.number()
        .required()
        .min(0),
    proxiesTimeout: Joi.number()
        .required()
        .min(500)
        .max(30 * ONE_SECOND_IN_MS),
    config: Joi.any()
        .required(),
    certificateDurationInMs: Joi.number()
        .required()
        .min(1),
});


export const schemaConnectorToUpdate = Joi.object({
    name: Joi.string()
        .required(),
    credentialId: Joi.string()
        .required(),
    proxiesMax: Joi.number()
        .required()
        .min(0),
    proxiesTimeout: Joi.number()
        .required()
        .min(500)
        .max(30 * ONE_SECOND_IN_MS),
    config: Joi.any()
        .required(),
});


export const schemaConnectorToScale = Joi
    .number()
    .min(0)
    .required();


export const schemaConnectorToActivate = Joi
    .bool()
    .required();


export const schemaFreeproxiesToRemove = Joi.object({
    ids: Joi.array()
        .items(Joi.string())
        .required(),
    duplicate: Joi.boolean()
        .required(),
    onlyOffline: Joi.boolean()
        .required(),
});


export const schemaTaskToCreate = Joi.object({
    type: Joi.string()
        .required(),
    stepMax: Joi.number()
        .required(),
    message: Joi.string()
        .required(),
    data: Joi.any()
        .required(),
});
