import { EProjectStatus } from '@scrapoxy/common';
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
