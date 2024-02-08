import {
    EProjectStatus,
    EProxyType,
    ONE_SECOND_IN_MS,
} from '@scrapoxy/common';
import * as Joi from 'joi';


export const schemaProjectStatusToSet = Joi
    .string()
    .valid(...Object.values(EProjectStatus))
    .required();


export const schemaProxiesToRemove = Joi
    .array()
    .items(Joi.object({
        id: Joi.string()
            .required(),
        force: Joi.boolean()
            .required(),
    }))
    .min(1)
    .required();


export const schemaFreeproxiesToCreate = Joi
    .array()
    .items(Joi.object({
        key: Joi.string()
            .required(),
        type: Joi.string()
            .valid(...Object.values(EProxyType))
            .required(),
        address: Joi.object({
            hostname: Joi.string()
                .required(),
            port: Joi.number()
                .min(0)
                .max(65536)
                .required(),
        }),
        auth: Joi.object({
            username: Joi.string()
                .required(),
            password: Joi.string()
                .required(),
        })
            .allow(null),
    }));


export const schemaFreeproxiesToRemove = Joi.object({
    ids: Joi.array()
        .items(Joi.string())
        .optional(),
    duplicate: Joi.boolean()
        .optional(),
    onlyOffline: Joi.boolean()
        .optional(),
})
    .optional();


export const schemaSourcesToCreate = Joi.array()
    .items(Joi.object({
        url: Joi.string()
            .required(),
        delay: Joi.number()
            .min(10 * ONE_SECOND_IN_MS)
            .required(),
    }))
    .required();


export const schemaSourcesToRemove = Joi.array()
    .items(Joi.string())
    .required();
