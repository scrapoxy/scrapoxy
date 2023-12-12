import * as Joi from 'joi';


const schemaCredential = Joi.object({
    subscriptionId: Joi
        .string()
        .uuid()
        .required(),
});
const schemaConfig = Joi.object({
    region: Joi.string()
        .required(),
    size: Joi.string()
        .required(),
    imageId: Joi.string()
        .optional(),
});


export { schemaCredential, schemaConfig };
