import { BadRequestException } from '@nestjs/common';
import { ECommanderError } from '@scrapoxy/common';
import * as Joi from 'joi';


export class ValidationError extends BadRequestException {
    static readonly id = ECommanderError.Validation;

    static from(data: any): ValidationError {
        return new ValidationError(data.message);
    }

    constructor(message: string) {
        super({
            id: ValidationError.id,
            message,
        });
    }
}


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
