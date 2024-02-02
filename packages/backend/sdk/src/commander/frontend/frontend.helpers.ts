import type { IFreeproxy } from '@scrapoxy/common';


export function filterDuplicateOutboundIpFreeproxies(freeproxies: IFreeproxy[]): IFreeproxy[] {
    const ips = new Set<string>();
    const freeproxiesFiltered: IFreeproxy[] = [];

    for (const fp of freeproxies) {
        if (fp.fingerprint) {
            if (!ips.has(fp.fingerprint.ip)) {
                ips.add(fp.fingerprint.ip);
            } else {
                freeproxiesFiltered.push(fp);
            }
        }
    }

    return freeproxiesFiltered;
}
