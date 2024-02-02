import type {
    IFreeproxy,
    IFreeproxyToRefresh,
} from '@scrapoxy/common';


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
        timeout: p.timeout,
        disconnectedTs: p.disconnectedTs,
        fingerprint: p.fingerprint,
        fingerprintError: p.fingerprintError,
    };

    return f;
}


export function toFreeproxyToRefresh(p: IFreeproxyToRefresh): IFreeproxyToRefresh {
    const f: IFreeproxyToRefresh = {
        id: p.id,
        type: p.type,
        connectorId: p.connectorId,
        projectId: p.projectId,
        key: p.key,
        address: p.address,
        auth: p.auth,
        timeout: p.timeout,
    };

    return f;
}
