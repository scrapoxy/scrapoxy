import { AbstractControl } from '@angular/forms';
import type { ValidationErrors } from '@angular/forms';


const URL_PATTERN = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=\[\]]*)$/;


export function ValidatorUrl(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;

    if (!value) {
        return null;
    }

    if (!URL_PATTERN.test(value)) {
        return {
            url: true,
        };
    }

    return null;
}
