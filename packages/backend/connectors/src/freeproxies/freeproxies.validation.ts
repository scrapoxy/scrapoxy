import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import * as Joi from 'joi';


const schemaConfig = Joi.object({
    freeproxiesTimeoutDisconnected: Joi.number()
        .required()
        .min(500)
        .max(30 * ONE_SECOND_IN_MS),
    freeproxiesTimeoutUnreachable: Joi.object({
        enabled: Joi.boolean()
            .required(),
        value: Joi.number()
            .required()
            .min(500),
    }),
});


export { schemaConfig };
