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
} from '@angular/forms';


export function ValidatorLifetime(control: AbstractControl): ValidationErrors | null {
    const valueRaw = control.value as string;

    if (!valueRaw) {
        return null;
    }

    const part1 = valueRaw.substring(
        0,
        valueRaw.length - 1
    );
    const part2 = valueRaw.substring(valueRaw.length - 1);
    let value;
    try {
        value = parseInt(
            part1,
            10
        );
    } catch (err: any) {
        return {
            required: true,
        };
    }

    switch (part2) {
        case 'm':
        case 's': {
            if (value < 1 || value > 59) {
                return {
                    range: true,
                };
            }

            break;
        }

        case 'h': {
            if (value < 1 || value > 24) {
                return {
                    range: true,
                };
            }

            break;
        }
    }

    return null;
}


@Component({
    selector: 'input-lifetime',
    templateUrl: './input-lifetime.component.html',
    styleUrls: [
        './input-lifetime.component.scss',
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: InputLifetimeComponent,
        },
    ],
})
export class InputLifetimeComponent implements ControlValueAccessor {
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

    unit: string;

    disabled = false;

    constructor(private readonly elRef: ElementRef) {
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    onChange = (value: string | undefined) => {};

    onTouched = () => {};

    onValueChange(e: Event): void {
        if (this.disabled) {
            return;
        }

        this.value = (e.target as HTMLInputElement).value ?? '';

        this.triggerOnChange();
    }

    onUnitChange(e: Event): void {
        if (this.disabled) {
            return;
        }

        this.unit = (e.target as HTMLSelectElement).value ?? '';

        this.triggerOnChange();
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(value: string | undefined): void {
        if (value) {
            const part1 = value.substring(
                0,
                value.length - 1
            );
            const part2 = value.substring(value.length - 1);

            if ([
                'h', 'm', 's',
            ].includes(part2)) {
                this.value = part1;
                this.unit = part2;
            } else {
                this.value = '';
                this.unit = '';
            }
        } else {
            this.value = '';
            this.unit = '';
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
        if (this.value === undefined ||
            this.unit === undefined) {
            this.onChange(void 0);

            return;
        }

        try {
            const value = parseInt(
                this.value,
                10
            );

            if (!value) {
                this.onChange(void 0);

                return;
            }
        } catch (err) {
            this.onChange(void 0);

            return;
        }

        const lifetime = `${this.value}${this.unit}`;

        this.onChange(lifetime);
    }
}
