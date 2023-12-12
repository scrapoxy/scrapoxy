import * as Joi from 'joi';


export const schemaTaskToUpdate = Joi.object({
    running: Joi.boolean()
        .required(),
    stepCurrent: Joi.number()
        .required()
        .min(0),
    message: Joi.string()
        .required(),
    nextRetryTs: Joi.number()
        .required()
        .min(0),
    data: Joi.any()
        .required(),
});
