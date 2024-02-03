import {
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
} from '../helpers';
import type { IAddress } from '../address';
import type {
    IConnectorSync,
    IConnectorView,
} from '../connectors';
import type { IFingerprintResponse } from '../fingerprint';


export const
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT = 5 * ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST = 500,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT = 10 * ONE_MINUTE_IN_MS;


export enum EProxyType {
    HTTP = 'http',
    HTTPS = 'https',
    SOCKS4 = 'socks4',
    SOCKS5 = 'socks5',
}


export const PROXY_TYPE_KEYS = Object.values(EProxyType) as string[];


export enum EProxyStatus {
    STARTED = 'STARTED',
    STARTING = 'STARTING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
    ERROR = 'ERROR',
}


export enum EConnectMode {
    TUNNEL = 'tunnel',
    MITM = 'mitm',
    AUTO = 'auto',
}


const PROXY_BASE_META = [
    'id',
    'type',
    'connectorId',
    'projectId',
    'key',
    'name',
    'status',
    'removing',
    'removingForce',
    'fingerprint',
    'fingerprintError',
    'createdTs',
];


export interface IProxyBase extends IFingerprintResponse {
    id: string;
    type: string;
    connectorId: string;
    projectId: string;
    key: string;
    name: string;
    status: EProxyStatus;
    removing: boolean;
    removingForce: boolean;
    createdTs: number;
}


export const PROXY_DATA_META = [
    ...PROXY_BASE_META,
    'config',
    'useragent',
    'timeoutDisconnected',
    'timeoutUnreachable',
    'autoRotateDelayFactor',
    'disconnectedTs',
];


export interface IProxyData extends IProxyBase {
    config: any;
    useragent: string;
    timeoutDisconnected: number;
    timeoutUnreachable: number | null;
    disconnectedTs: number | null;
    autoRotateDelayFactor: number;
}


export const PROXY_SYNC_META = [
    ...PROXY_DATA_META, 'requests',
];


export interface IProxySync extends IProxyData {
    requests: number;
}


export const PROXY_VIEW_META = [
    ...PROXY_BASE_META,
    'connections',
    'requests',
    'bytesReceived',
    'bytesSent',
];


export interface IProxyView extends IProxyBase {
    requests: number;
    bytesReceived: number;
    bytesSent: number;
}


export interface IProxyViewUI extends IProxyBase {
    connectorName: string;
    online: boolean;
    elapsed: number;
    requests: number;
    bytesReceived: number;
    bytesSent: number;
}


export interface IProxyMetricsAdd {
    id: string;
    projectId: string;
    connectorId: string;
    requests: number;
    bytesReceived: number;
    bytesSent: number;
}


export interface IConnectorProxyRefreshed {
    type: string;
    key: string;
    name: string;
    status: EProxyStatus;
    config: any;
}


export interface IConnectorProxiesView {
    connector: IConnectorView;
    proxies: IProxyView[];
}


export interface IConnectorProxiesSync {
    connector: IConnectorSync;
    proxies: IProxySync[];
}


export const PROXY_TO_CONNECT_META = [
    'id',
    'type',
    'connectorId',
    'projectId',
    'key',
    'config',
    'useragent',
    'timeoutDisconnected',
];


export interface IProxyToConnect {
    id: string;
    type: string;
    projectId: string;
    connectorId: string;
    key: string;
    config: any;
    useragent: string;
    timeoutDisconnected: number;
}


export const PROXY_TO_REFRESH_META = [
    ...PROXY_TO_CONNECT_META,
    'bytesReceived',
    'bytesSent',
    'requests',
];


export interface IProxyToRefresh extends IProxyToConnect {
    bytesReceived: number;
    bytesSent: number;
    requests: number;
}


export interface IProxyInfo {
    key: string;
    description: string;
}


export interface IProxiesToRefresh {
    installId: string;
    proxies: IProxyToRefresh[];
}


export interface IProxyRefreshed extends IFingerprintResponse {
    id: string;
}


export interface IProxyLastConnectionToUpdate {
    projectId: string;
    connectorId: string;
    proxyId: string;
    lastConnectionTs: number;
}


export interface IProxiesNextRefreshToUpdate {
    proxiesIds: string[];
    nextRefreshTs: number;
}


export interface ISynchronizeLocalProxiesData {
    created: IProxyData[];
    updated: IProxyData[];
    removed: IProxyData[];
}


export interface ISynchronizeLocalProxiesBase {
    created: IProxyBase[];
    updated: IProxyBase[];
    removed: IProxyBase[];
}


export interface IProxyKeyToRemove {
    key: string;
    force: boolean;
}


export interface IProxyIdToRemove {
    id: string;
    force: boolean;
}


export interface ISynchronizeRemoteProxies {
    proxiesToCreateCount: number;
    keysToStart: string[];
    keysToRemove: IProxyKeyToRemove[];
}


export interface ICreateRemoveLocalProxies {
    created: IConnectorProxyRefreshed[];
    keysRemoved: string[];
}


export interface IProxyTransportAuth {
    username: string;
    password: string;
}


export interface IProxyTransport {
    type: EProxyType;
    address: IAddress;
    auth: IProxyTransportAuth | null;
}
