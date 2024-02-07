import {
    Component,
    ElementRef,
    Input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
    ETimeType,
    fromDelay,
    parseNumber,
    toDelay,
} from '@scrapoxy/frontend-sdk';
import type { ControlValueAccessor } from '@angular/forms';
import type { IOptionalValue } from '@scrapoxy/common';


@Component({
    selector: 'input-delay-optional',
    templateUrl: './input-delay-optional.component.html',
    styleUrls: [
        './input-delay-optional.component.scss',
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: InputDelayOptionalComponent,
        },
    ],
})
export class InputDelayOptionalComponent implements ControlValueAccessor {
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

    optionalValueType: ETimeType;

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

    onTypeChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.optionalValueType = e.target.value ?? ETimeType.MS;

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

            const delay = toDelay(optional.value);

            if (delay) {
                this.optionalValue = delay.value.toString();
                this.optionalValueType = delay.type;
            } else {
                this.optionalValue = '';
                this.optionalValueType = ETimeType.MS;
            }
        } else {
            this.optionalEnabled = false;
            this.optionalValue = '';
            this.optionalValueType = ETimeType.MS;
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
        const optionalValue = parseNumber(this.optionalValue);

        if (optionalValue === undefined) {
            this.onChange(void 0);

            return;
        }

        const value = fromDelay({
            value: optionalValue,
            type: this.optionalValueType,
        });

        if (!value) {
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
