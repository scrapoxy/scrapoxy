import type { IFingerprint } from './fingerprint.interface';


export function fingerprintEquals(
    fpA: IFingerprint | null | undefined,
    fpB: IFingerprint | null | undefined
) {
    if (fpA) {
        if (fpB) {
            return fpA.ip === fpB.ip;
        } else {
            return false;
        }
    } else {
        return !fpB;
    }
}
