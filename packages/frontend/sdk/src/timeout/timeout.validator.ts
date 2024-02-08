import type {
    FormGroup,
    ValidationErrors,
} from '@angular/forms';
import type { IOptionalValue } from '@scrapoxy/common';


export function matchTimeout(
    disconnectedName: string,
    unreachableName: string
) {
    return function(frm: FormGroup): ValidationErrors | null {
        const disconnectedCmp = frm.get(disconnectedName);

        if (!disconnectedCmp) {
            throw new Error(`Cannot find form control ${disconnectedName} in the form group`);
        }

        const timeoutDisconnectedValue = disconnectedCmp.value as number;

        if (!timeoutDisconnectedValue) {
            return null;
        }

        const unreachableCmp = frm.get(unreachableName);

        if (!unreachableCmp) {
            throw new Error(`Cannot find form control ${unreachableName} in the form group`);
        }

        const timeoutUnreachable = unreachableCmp.value as IOptionalValue<number>;

        if (!timeoutUnreachable ||
            !timeoutUnreachable.enabled ||
            timeoutDisconnectedValue <= timeoutUnreachable.value
        ) {
            return null;
        }

        unreachableCmp
            .setErrors({
                timeout: true,
            });

        return null;
    };
}
