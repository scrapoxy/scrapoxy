import { EEventScope } from '@scrapoxy/common';
import * as Joi from 'joi';


export const schemaProjectNamespace = Joi.object({
    scope: Joi.string()
        .valid(...Object.values(EEventScope))
        .required(),
    projectId: Joi.string()
        .required(),
});
