import * as Joi from 'joi';


const schemaCredential = Joi.object({
    token: Joi.string()
        .required(),
});


export { schemaCredential };
