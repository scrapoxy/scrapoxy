import { AbstractControl } from '@angular/forms';
import type {
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import type { IOptionalValue } from '@scrapoxy/common';


export interface IValidatorOptionalNumberOptions {
    min?: number;
    max?: number;
}


export function ValidatorOptionalNumber(opts?: IValidatorOptionalNumberOptions): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const optional = control.value as IOptionalValue<any>;

        if (!optional) {
            return null;
        }

        if (opts) {
            if (opts.min !== undefined) {
                if (optional.value < opts.min) {
                    return {
                        min: true,
                    };
                }
            }

            if (opts.max !== undefined) {
                if (optional.value >= opts.max) {
                    return {
                        max: true,
                    };
                }
            }
        }

        return null;
    };
}
