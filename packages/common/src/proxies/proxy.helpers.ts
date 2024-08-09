import {
    EConnectMode,
    EProxyStatus,
} from './proxy.interface';
import type {
    IConnectorProxiesView,
    IProxyBase,
    IProxyData,
    IProxySync,
    IProxyView,
    ISynchronizeLocalProxiesBase,
    ISynchronizeLocalProxiesData,
} from './proxy.interface';


export function toProxyBase(p: IProxyBase): IProxyBase {
    const base: IProxyBase = {
        id: p.id,
        connectorId: p.connectorId,
        projectId: p.projectId,
        type: p.type,
        key: p.key,
        name: p.name,
        status: p.status,
        removing: p.removing,
        removingForce: p.removingForce,
        fingerprint: p.fingerprint,
        fingerprintError: p.fingerprintError,
        createdTs: p.createdTs,
    };

    return base;
}


export function toProxyView(model: IProxyView): IProxyView {
    const view: IProxyView = {
        id: model.id,
        connectorId: model.connectorId,
        projectId: model.projectId,
        type: model.type,
        key: model.key,
        name: model.name,
        status: model.status,
        removing: model.removing,
        removingForce: model.removingForce,
        fingerprint: model.fingerprint,
        fingerprintError: model.fingerprintError,
        createdTs: model.createdTs,
        requests: model.requests,
        requestsValid: model.requestsValid,
        requestsInvalid: model.requestsInvalid,
        bytesReceived: model.bytesReceived,
        bytesSent: model.bytesSent,
    };

    return view;
}


export function toProxyData(p: IProxyData): IProxyData {
    const data: IProxyData = {
        id: p.id,
        connectorId: p.connectorId,
        projectId: p.projectId,
        type: p.type,
        transportType: p.transportType,
        key: p.key,
        name: p.name,
        config: p.config,
        status: p.status,
        removing: p.removing,
        removingForce: p.removingForce,
        fingerprint: p.fingerprint,
        fingerprintError: p.fingerprintError,
        createdTs: p.createdTs,
        useragent: p.useragent,
        timeoutDisconnected: p.timeoutDisconnected,
        timeoutUnreachable: p.timeoutUnreachable,
        disconnectedTs: p.disconnectedTs,
        autoRotateDelayFactor: p.autoRotateDelayFactor,
        ciphers: p.ciphers,
    };

    return data;
}


export function toProxySync(p: IProxySync): IProxySync {
    const sync: IProxySync = {
        id: p.id,
        connectorId: p.connectorId,
        projectId: p.projectId,
        type: p.type,
        transportType: p.transportType,
        key: p.key,
        name: p.name,
        config: p.config,
        status: p.status,
        removing: p.removing,
        removingForce: p.removingForce,
        fingerprint: p.fingerprint,
        fingerprintError: p.fingerprintError,
        createdTs: p.createdTs,
        useragent: p.useragent,
        timeoutDisconnected: p.timeoutDisconnected,
        timeoutUnreachable: p.timeoutUnreachable,
        disconnectedTs: p.disconnectedTs,
        autoRotateDelayFactor: p.autoRotateDelayFactor,
        ciphers: p.ciphers,
        requests: p.requests,
        requestsValid: p.requestsValid,
        requestsInvalid: p.requestsInvalid,
    };

    return sync;
}


export function fromProxySyncToData(p: IProxySync): IProxyData {
    const data: IProxyData = {
        id: p.id,
        connectorId: p.connectorId,
        projectId: p.projectId,
        type: p.type,
        transportType: p.transportType,
        key: p.key,
        name: p.name,
        config: p.config,
        status: p.status,
        removing: p.removing,
        removingForce: p.removingForce,
        fingerprint: p.fingerprint,
        fingerprintError: p.fingerprintError,
        createdTs: p.createdTs,
        useragent: p.useragent,
        timeoutDisconnected: p.timeoutDisconnected,
        timeoutUnreachable: p.timeoutUnreachable,
        disconnectedTs: p.disconnectedTs,
        autoRotateDelayFactor: p.autoRotateDelayFactor,
        ciphers: p.ciphers,
    };

    return data;
}


export function toSynchronizeLocalProxiesBase(source: ISynchronizeLocalProxiesData): ISynchronizeLocalProxiesBase {
    const destination: ISynchronizeLocalProxiesBase = {
        created: source.created.map((p) => toProxyBase(p)),
        updated: source.updated.map((p) => toProxyBase(p)),
        removed: source.removed.map((p) => toProxyBase(p)),
    };

    return destination;
}


export function formatProxyId(
    connectorId: string, key: string
) {
    return `${connectorId}:${key}`;
}


export function isProxyOnline(p: IProxyBase): boolean {
    return p.status === EProxyStatus.STARTED &&
        !!p.fingerprint &&
        !p.removing;
}


export function countProxiesViews(views: IConnectorProxiesView[]): number {
    return views.map((v) => v.proxies.length)
        .reduce(
            (
                a, b
            ) => a + b,
            0
        );
}


export function countProxiesOnlineView(view: IConnectorProxiesView): number {
    return view.proxies.filter(isProxyOnline).length;
}


export function countProxiesOnlineViews(views: IConnectorProxiesView[]): number {
    return views.map((v) => countProxiesOnlineView(v))
        .reduce(
            (
                a, b
            ) => a + b,
            0
        );
}


export function convertToConnectMode(header: any): EConnectMode {
    if (header === 'mitm') {
        return EConnectMode.MITM;
    }

    if (header === 'tunnel') {
        return EConnectMode.TUNNEL;
    }

    return EConnectMode.AUTO;
}
