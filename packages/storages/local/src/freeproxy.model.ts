import type { IFreeproxy } from '@scrapoxy/common';


export interface IFreeproxyModel extends IFreeproxy {
    nextRefreshTs: number;
}


export function toFreeproxy(p: IFreeproxy): IFreeproxy {
    const f: IFreeproxy = {
        id: p.id,
        type: p.type,
        connectorId: p.connectorId,
        projectId: p.projectId,
        key: p.key,
        address: p.address,
        auth: p.auth,
        fingerprint: p.fingerprint,
        fingerprintError: p.fingerprintError,
    };

    return f;
}
