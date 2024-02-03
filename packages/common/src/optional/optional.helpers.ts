import type { IOptionalValue } from './optional.interface';


export function toOptionalValue<T>(optional: IOptionalValue<T>): T | null {
    return optional.enabled ? optional.value : null;
}
