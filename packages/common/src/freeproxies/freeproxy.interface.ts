import type { IFingerprintResponse } from '../fingerprint';
import type { IProxyTransport } from '../proxies';


export interface IFreeproxyBase extends IProxyTransport {
    key: string;
}


export const FREEPROXY_META = [
    'id',
    'type',
    'connectorId',
    'projectId',
    'key',
    'address',
    'auth',
    'timeoutDisconnected',
    'timeoutUnreachable',
    'fingerprint',
    'fingerprintError',
    'disconnectedTs',
];


export interface IFreeproxy extends IFreeproxyBase, IFingerprintResponse {
    id: string;
    connectorId: string;
    projectId: string;
    timeoutDisconnected: number;
    timeoutUnreachable: number | null;
    disconnectedTs: number | null;
}


export const FREEPROXY_TO_REFRESH_META = [
    'id',
    'type',
    'connectorId',
    'projectId',
    'key',
    'address',
    'auth',
    'timeoutDisconnected',
    'timeoutUnreachable',
];


export interface IFreeproxyToRefresh extends IFreeproxyBase {
    id: string;
    connectorId: string;
    projectId: string;
    timeoutDisconnected: number;
    timeoutUnreachable: number | null;
}


export interface IFreeproxiesToCreate {
    projectId: string;
    connectorId: string;
    freeproxies: IFreeproxy[];
}


export interface ISynchronizeFreeproxies {
    updated: IFreeproxy[];
    removed: IFreeproxy[];
}


export interface IFreeproxiesToRefresh {
    installId: string;
    freeproxies: IFreeproxyToRefresh[];
}


export interface IFreeproxyRefreshed extends IFingerprintResponse {
    id: string;
    connectorId: string;
    projectId: string;
}


export interface ISelectedFreeproxies {
    keys: string[];
}


export interface INewFreeProxies {
    count: number;
    excludeKeys: string[];
}


export interface IFreeproxiesToRemoveOptions {
    ids?: string[];
    duplicate?: boolean;
    onlyOffline?: boolean;
}


export interface IFreeproxiesNextRefreshToUpdate {
    freeproxiesIds: string[];
    nextRefreshTs: number;
}
