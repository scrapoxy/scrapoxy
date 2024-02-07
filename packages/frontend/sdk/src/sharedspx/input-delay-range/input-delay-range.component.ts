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
import type { IRange } from '@scrapoxy/common';


@Component({
    selector: 'input-delay-range',
    templateUrl: './input-delay-range.component.html',
    styleUrls: [
        './input-delay-range.component.scss',
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: InputDelayRangeComponent,
        },
    ],
})
export class InputDelayRangeComponent implements ControlValueAccessor {
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

    rangeMinType: ETimeType;

    rangeMax: string;

    rangeMaxType: ETimeType;

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

    onMinTypeChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.rangeMinType = e.target.value ?? ETimeType.MS;

        this.triggerOnChange();
    }

    onMaxChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.rangeMax = e.target.value ?? '';

        this.triggerOnChange();
    }

    onMaxTypeChange(e: any): void {
        if (this.disabled) {
            return;
        }

        this.rangeMaxType = e.target.value ?? ETimeType.MS;

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

            const delayMin = toDelay(range.min);

            if (delayMin) {
                this.rangeMin = delayMin.value.toString();
                this.rangeMinType = delayMin.type;
            } else {
                this.rangeMin = '';
                this.rangeMinType = ETimeType.MS;
            }

            const delayMax = toDelay(range.max);

            if (delayMax) {
                this.rangeMax = delayMax.value.toString();
                this.rangeMaxType = delayMax.type;
            } else {
                this.rangeMax = '';
                this.rangeMaxType = ETimeType.MS;
            }
        } else {
            this.rangeEnabled = false;
            this.rangeMin = '';
            this.rangeMinType = ETimeType.MS;
            this.rangeMax = '';
            this.rangeMaxType = ETimeType.MS;
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
        const minValue = parseNumber(this.rangeMin);

        if (minValue === undefined) {
            this.onChange(void 0);

            return;
        }

        const min = fromDelay({
            value: minValue,
            type: this.rangeMinType,
        });

        if (!min) {
            this.onChange(void 0);

            return;
        }

        const maxValue = parseNumber(this.rangeMax);

        if (maxValue === undefined) {
            this.onChange(void 0);

            return;
        }

        const max = fromDelay({
            value: maxValue,
            type: this.rangeMaxType,
        });

        if (!max) {
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
