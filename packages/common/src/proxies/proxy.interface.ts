import { ADDRESS_SWAGGER_PROPS } from '../address';
import { CONNECTOR_VIEW_SWAGGER_PROPS } from '../connectors';
import {
    FINGERPRINT_RESPONSE_META,
    FINGERPRINT_RESPONSE_SWAGGER_PROPS,
} from '../fingerprint';
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


export const PROXY_STATUS_KEYS = Object.values(EProxyStatus) as string[];


export enum EConnectMode {
    TUNNEL = 'tunnel',
    MITM = 'mitm',
    AUTO = 'auto',
}


const PROXY_BASE_META = [
    ...FINGERPRINT_RESPONSE_META,
    'id',
    'type',
    'connectorId',
    'projectId',
    'key',
    'name',
    'status',
    'removing',
    'removingForce',
    'createdTs',
];


export const PROXY_BASE_SWAGGER_PROPS = {
    ...FINGERPRINT_RESPONSE_SWAGGER_PROPS,
    id: {
        type: 'string',
        description: 'uuid of the connector + \':\' + key of the proxy',
        example: 'e7e5142f-b3e3-410b-bce2-8c43a7e32712:i-0123456789abcdef0',
    },
    type: {
        type: 'string',
        enum: PROXY_TYPE_KEYS,
        description: 'type of provider',
        example: 'aws',
    },
    connectorId: {
        type: 'string',
        description: 'uuid of the connector',
        example: 'e7e5142f-b3e3-410b-bce2-8c43a7e32712',
    },
    projectId: {
        type: 'string',
        description: 'uuid of the project',
        example: '8accdab6-a5c4-4cef-9a29-86f0c91ff1e1',
    },
    key: {
        type: 'string',
        description: 'unique key of the proxy in the connector',
        example: 'i-0123456789abcdef0',
    },
    name: {
        type: 'string',
        description: 'name of the proxy',
        example: 'myproxy-1',
    },
    status: {
        type: 'string',
        enum: PROXY_STATUS_KEYS,
        description: 'status of the proxy from STARTING, STARTED, STOPPING, STOPPED or ERROR',
        example: 'STARTED',
    },
    removing: {
        type: 'boolean',
        description: 'true if the proxy is being removed',
        example: false,
    },
    removingForce: {
        type: 'boolean',
        description: 'true if the proxy is being removed by force',
        example: false,
    },
    createdTs: {
        type: 'number',
        description: 'timestamp in ms of the proxy creation',
        example: 1711791332000,
    },
};


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
    'transportType',
    'config',
    'useragent',
    'timeoutDisconnected',
    'timeoutUnreachable',
    'autoRotateDelayFactor',
    'disconnectedTs',
];


export interface IProxyData extends IProxyBase {
    transportType: string;
    config: any;
    useragent: string;
    timeoutDisconnected: number;
    timeoutUnreachable: number | null;
    disconnectedTs: number | null;
    autoRotateDelayFactor: number;
}


export const PROXY_SYNC_META = [
    ...PROXY_DATA_META, 'requestsValid', 'requestsInvalid',
];


export interface IProxySync extends IProxyData {
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
}


export const PROXY_VIEW_META = [
    ...PROXY_BASE_META,
    'requests',
    'requestsValid',
    'requestsInvalid',
    'bytesReceived',
    'bytesSent',
];


export const PROXY_VIEW_SWAGGER_PROPS = {
    ...PROXY_BASE_SWAGGER_PROPS,
    requests: {
        type: 'number',
        description: 'number of requests made by the proxy',
        example: 54,
    },
    requestsValid: {
        type: 'number',
        description: 'number of response with statusCode < 400',
        example: 54,
    },
    requestsInvalid: {
        type: 'number',
        description: 'number of response with statusCode >= 400',
        example: 54,
    },
    bytesReceived: {
        type: 'number',
        description: 'number of bytes received by the proxy',
        example: 549128323,
    },
    bytesSent: {
        type: 'number',
        description: 'number of bytes sent by the proxy',
        example: 123456789,
    },
};


export interface IProxyView extends IProxyBase {
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
    bytesReceived: number;
    bytesSent: number;
}


export interface IProxyViewUI extends IProxyBase {
    connectorName: string;
    online: boolean;
    elapsed: number;
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
    bytesReceived: number;
    bytesSent: number;
}


export interface IProxyMetricsAdd {
    id: string;
    projectId: string;
    connectorId: string;
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
    bytesReceived: number;
    bytesSent: number;
}


export interface IConnectorProxyRefreshed {
    type: string;
    transportType: string;
    key: string;
    name: string;
    status: EProxyStatus;
    config: any;
}


export const CONNECTOR_PROXIES_VIEW_SWAGGER_PROPS = {
    connector: {
        type: 'object',
        properties: CONNECTOR_VIEW_SWAGGER_PROPS,
        description: 'Connector information',
    },
    proxies: {
        type: 'array',
        items: {
            type: 'object',
            properties: PROXY_VIEW_SWAGGER_PROPS,
        },
        description: 'List of proxies of the connector',
    },
};


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
    'transportType',
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
    transportType: string;
    projectId: string;
    connectorId: string;
    key: string;
    config: any;
    useragent: string;
    timeoutDisconnected: number;
}


export const PROXY_TO_REFRESH_META = [
    ...PROXY_TO_CONNECT_META,
    'requests',
    'requestsValid',
    'requestsInvalid',
    'bytesReceived',
    'bytesSent',
];


export interface IProxyToRefresh extends IProxyToConnect {
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
    bytesReceived: number;
    bytesSent: number;
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


export const PROXY_ID_TO_REMOVE_SWAGGER_PROPS = {
    id: {
        type: 'string',
        description: 'uuid of the connector + \':\' + key of the proxy',
        example: 'e7e5142f-b3e3-410b-bce2-8c43a7e32712:i-0123456789abcdef0',
    },
    force: {
        type: 'boolean',
        description: 'true to force the removal',
        example: false,
    },
};


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


export const PROXY_TRANSPORT_AUTH_SWAGGER_PROPS = {
    username: {
        type: 'string',
        description: 'username of the proxy',
        example: 'myadmin',
    },
    password: {
        type: 'string',
        description: 'password of the proxy',
        example: 'mypassw0rd!',
    },
};


export interface IProxyTransportAuth {
    username: string;
    password: string;
}


export const PROXY_TRANSPORT_META = [
    'type', 'address', 'auth',
];


export const PROXY_TRANSPORT_SWAGGER_PROPS = {
    type: {
        type: 'string',
        enum: PROXY_TYPE_KEYS,
    },
    address: {
        type: 'object',
        properties: ADDRESS_SWAGGER_PROPS,
    },
    auth: {
        type: 'object',
        properties: PROXY_TRANSPORT_AUTH_SWAGGER_PROPS,
        nullable: true,
    },
};


export interface IProxyTransport {
    type: EProxyType;
    address: IAddress;
    auth: IProxyTransportAuth | null;
}
