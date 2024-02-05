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


@Component({
    selector: 'input-optional-number',
    templateUrl: './input-optional.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: InputOptionalNumberComponent,
        },
    ],
})
export class InputOptionalNumberComponent implements ControlValueAccessor {
    @Input()
    placeholder = '';

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

    optionalValue: string;

    optionalEnabled: boolean;

    disabled = false;

    constructor(private readonly elRef: ElementRef) {}

    // eslint-disable-next-line unused-imports/no-unused-vars
    onChange = (optional: IOptionalValue<number> | undefined) => {};

    onTouched = () => {};

    onValueChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.optionalValue = e.target.value ?? '';

        this.triggerOnChange();
    }

    toggleEnabled() {
        if (this.disabled) {
            return;
        }

        this.optionalEnabled = !this.optionalEnabled;

        this.triggerOnChange();
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(optional: IOptionalValue<number> | undefined): void {
        if (optional) {
            this.optionalEnabled = optional.enabled;
            this.optionalValue = optional.value.toString();
        } else {
            this.optionalEnabled = false;
            this.optionalValue = '';
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
        const value = parseNumber(this.optionalValue);

        if (value === undefined) {
            this.onChange(void 0);

            return;
        }

        const optional: IOptionalValue<number> = {
            enabled: this.optionalEnabled,
            value,
        };

        this.onChange(optional);
    }
}
