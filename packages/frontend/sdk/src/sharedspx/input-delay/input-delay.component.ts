import {
    Component,
    ElementRef,
    Input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
    fromDelay,
    toDelay,
} from './delay.helpers';
import { ETimeType } from './delay.interface';
import { parseNumber } from '../../helpers';
import type { ControlValueAccessor } from '@angular/forms';


@Component({
    selector: 'input-delay',
    templateUrl: './input-delay.component.html',
    styleUrls: [
        './input-delay.component.scss',
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: InputDelayComponent,
        },
    ],
})
export class InputDelayComponent implements ControlValueAccessor {
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

    value: string;

    valueType: ETimeType;

    disabled = false;

    constructor(private readonly elRef: ElementRef) {}

    // eslint-disable-next-line unused-imports/no-unused-vars
    onChange = (value: number | undefined) => {};

    onTouched = () => {};

    onValueChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.value = e.target.value ?? '';

        this.triggerOnChange();
    }

    onTypeChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.valueType = e.target.value ?? ETimeType.MS;

        this.triggerOnChange();
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(value: number | undefined): void {
        if (value) {
            const delay = toDelay(value);

            if (delay) {
                this.value = delay.value.toString();
                this.valueType = delay.type;
            } else {
                this.value = '';
                this.valueType = ETimeType.MS;
            }
        } else {
            this.value = '';
            this.valueType = ETimeType.MS;
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
        const value = parseNumber(this.value);

        if (value === undefined) {
            this.onChange(void 0);

            return;
        }

        const valueFinal = fromDelay({
            value,
            type: this.valueType,
        });

        this.onChange(valueFinal);
    }
}
