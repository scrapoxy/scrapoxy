import type {
    IFreeproxy,
    IFreeproxyToRefresh,
} from '@scrapoxy/common';


export interface IFreeproxyModel extends IFreeproxy {
    nextRefreshTs: number;
}


export function toFreeproxy(p: IFreeproxyModel): IFreeproxy {
    const f: IFreeproxy = {
        id: p.id,
        type: p.type,
        connectorId: p.connectorId,
        projectId: p.projectId,
        key: p.key,
        address: p.address,
        auth: p.auth,
        timeoutDisconnected: p.timeoutDisconnected,
        disconnectedTs: p.disconnectedTs,
        fingerprint: p.fingerprint,
        fingerprintError: p.fingerprintError,
    };

    return f;
}


export function toFreeproxyToRefresh(p: IFreeproxyModel): IFreeproxyToRefresh {
    const f: IFreeproxyToRefresh = {
        id: p.id,
        type: p.type,
        connectorId: p.connectorId,
        projectId: p.projectId,
        key: p.key,
        address: p.address,
        auth: p.auth,
        timeoutDisconnected: p.timeoutDisconnected,
    };

    return f;
}
