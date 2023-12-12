import * as Joi from 'joi';


export const schemaUserToUpdate = Joi.object({
    name: Joi.string()
        .required(),
    email: Joi.string()
        .allow(null)
        .optional(),
    picture: Joi.string()
        .allow(null)
        .optional(),
});


export const schemaUserToCreate = schemaUserToUpdate.keys({
    id: Joi.string()
        .required(),
});
