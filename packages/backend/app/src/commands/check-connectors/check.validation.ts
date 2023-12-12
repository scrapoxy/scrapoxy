import * as Joi from 'joi';


export const schema = Joi.array()
    .items(Joi.object({
        type: Joi.string()
            .required(),
        name: Joi.string()
            .required(),
        credential: Joi.any()
            .required(),
        maxProxies: Joi.number()
            .required()
            .min(0),
    }));
