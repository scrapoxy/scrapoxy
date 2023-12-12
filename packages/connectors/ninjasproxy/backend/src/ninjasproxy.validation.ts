import * as Joi from 'joi';


const schemaCredential = Joi.object({
    apiKey: Joi.string()
        .required(),
});


export { schemaCredential };
