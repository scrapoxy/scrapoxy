import * as Joi from 'joi';
import { ValidationError } from '../commander-client';


export async function validate(
    schema: Joi.Schema, data: any
): Promise<void> {
    try {
        await schema.validateAsync(data);
    } catch (err: any) {
        if (err instanceof Joi.ValidationError) {
            throw new ValidationError(err.message);
        }

        throw err;
    }
}
