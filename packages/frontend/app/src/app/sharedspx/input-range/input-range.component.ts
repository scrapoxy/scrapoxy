import {
    Component,
    ElementRef,
    Input,
} from '@angular/core';
import {
    AbstractControl,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { parseNumber } from '@scrapoxy/frontend-sdk';
import type {
    ControlValueAccessor,
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import type { IRange } from '@scrapoxy/common';


export interface IValidatorRangeOptions {
    min?: number;
    max?: number;
}


export function ValidatorRange(opts?: IValidatorRangeOptions): ValidatorFn {
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


@Component({
    selector: 'input-range',
    templateUrl: './input-range.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: InputRangeComponent,
        },
    ],
})
export class InputRangeComponent implements ControlValueAccessor {
    @Input()
    placeholderMin = '';

    @Input()
    placeholderMax = '';

    @Input()
    get valid(): boolean | undefined {
        return this.validValue;
    }

    set valid(value: boolean | undefined) {
        this.validValue = value;

        if (this.validValue === true) {
            this.elRef.nativeElement.classList.remove('is-invalid');
            this.elRef.nativeElement.classList.add('is-valid');
        } else if (this.validValue === false) {
            this.elRef.nativeElement.classList.remove('is-valid');
            this.elRef.nativeElement.classList.add('is-invalid');
        } else {
            this.elRef.nativeElement.classList.remove('is-valid');
            this.elRef.nativeElement.classList.remove('is-invalid');
        }
    }

    validValue: boolean | undefined;

    rangeMin: string;

    rangeMax: string;

    rangeEnabled: boolean;

    disabled = false;

    constructor(private readonly elRef: ElementRef) {}

    // eslint-disable-next-line unused-imports/no-unused-vars
    onChange = (range: IRange | undefined) => {};

    onTouched = () => {};

    onMinChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.rangeMin = e.target.value ?? '';

        this.triggerOnChange();
    }

    onMaxChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.rangeMax = e.target.value ?? '';

        this.triggerOnChange();
    }

    toggleEnabled() {
        if (this.disabled) {
            return;
        }

        this.rangeEnabled = !this.rangeEnabled;

        this.triggerOnChange();
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(range: IRange | undefined): void {
        if (range) {
            this.rangeEnabled = range.enabled;
            this.rangeMin = range.min.toString();
            this.rangeMax = range.max.toString();
        } else {
            this.rangeEnabled = false;
            this.rangeMin = '';
            this.rangeMax = '';
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    markAsTouched(): void {
        this.onTouched();
    }

    private triggerOnChange() {
        const min = parseNumber(this.rangeMin);

        if (min === undefined) {
            this.onChange(void 0);

            return;
        }

        const max = parseNumber(this.rangeMax);

        if (max === undefined) {
            this.onChange(void 0);

            return;
        }

        const range: IRange = {
            enabled: this.rangeEnabled,
            min,
            max,
        };

        this.onChange(range);
    }
}
