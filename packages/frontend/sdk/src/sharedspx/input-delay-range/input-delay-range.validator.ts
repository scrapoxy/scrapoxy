import { AbstractControl } from '@angular/forms';
import type {
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import type { IRange } from '@scrapoxy/common';


export interface IValidatorDelayRangeOptions {
    min?: number;
    max?: number;
}


export function ValidatorDelayRange(opts?: IValidatorDelayRangeOptions): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const range = control.value as IRange;

        if (!range) {
            return null;
        }

        if (range.min > range.max) {
            return {
                inverted: true,
            };
        }

        if (opts) {
            if (opts.min !== undefined) {
                if (range.min < opts.min ||
                    range.max < opts.min) {
                    return {
                        min: true,
                    };
                }
            }

            if (opts.max !== undefined) {
                if (range.min > opts.max ||
                    range.max > opts.max) {
                    return {
                        max: true,
                    };
                }
            }
        }

        return null;
    };
}
