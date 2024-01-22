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
    'fingerprint',
    'fingerprintError',
];


export interface IFreeproxy extends IFreeproxyBase, IFingerprintResponse {
    id: string;
    connectorId: string;
    projectId: string;
}


export interface IFreeproxyToRefresh extends IFreeproxyBase {
    id: string;
    connectorId: string;
    projectId: string;
    timeout: number;
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
    ids: string[];
    onlyOffline: boolean;
}


export interface IFreeproxiesToRemove {
    projectId: string;
    connectorId: string;
    freeproxiesIds: string[];
}


export interface IFreeproxiesNextRefreshToUpdate {
    freeproxiesIds: string[];
    nextRefreshTs: number;
}
