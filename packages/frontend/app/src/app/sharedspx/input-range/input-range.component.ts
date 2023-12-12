import {
    Component,
    ElementRef,
    Input,
} from '@angular/core';
import {
    AbstractControl,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';
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
        const value = control.value as IRange;

        if (!value) {
            return null;
        }

        if (value.min > value.max) {
            return {
                inverted: true,
            };
        }

        if (opts) {
            if (opts.min !== undefined) {
                if (value.min < opts.min || value.max < opts.min) {
                    return {
                        min: true,
                    };
                }
            }

            if (opts.max !== undefined) {
                if (value.min > opts.max || value.max > opts.max) {
                    return {
                        max: true,
                    };
                }
            }
        }

        return null;
    };
}


function parseNumber(text: string | undefined | null): number | undefined {
    if (!text || text.length <= 0) {
        return;
    }

    try {
        const value = parseInt(
            text,
            10
        );

        if (isNaN(value)) {
            return;
        }

        return value;
    } catch (err: any) {
        return;
    }
}


@Component({
    selector: 'input-range',
    templateUrl: './input-range.component.html',
    styleUrls: [
        './input-range.component.scss',
    ],
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

    min: string;

    max: string;

    disabled = false;

    constructor(private readonly elRef: ElementRef) {
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    onChange = (value: IRange | undefined) => {};

    onTouched = () => {};

    onMinChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.min = e.target.value ?? '';

        this.triggerOnChange();
    }

    onMaxChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.max = e.target.value ?? '';

        this.triggerOnChange();
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(value: IRange | undefined): void {
        if (value) {
            this.min = value.min.toString();
            this.max = value.max.toString();
        } else {
            this.min = '';
            this.max = '';
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
        const min = parseNumber(this.min);

        if (min === undefined) {
            this.onChange(void 0);

            return;
        }

        const max = parseNumber(this.max);

        if (max === undefined) {
            this.onChange(void 0);

            return;
        }

        const range: IRange = {
            min,
            max,
        };

        this.onChange(range);
    }
}
