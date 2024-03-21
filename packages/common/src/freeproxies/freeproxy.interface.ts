import {
    FINGERPRINT_RESPONSE_META,
    FINGERPRINT_RESPONSE_SWAGGER_PROPS,
} from '../fingerprint';
import {
    PROXY_TRANSPORT_META,
    PROXY_TRANSPORT_SWAGGER_PROPS,
} from '../proxies';
import type { IFingerprintResponse } from '../fingerprint';
import type { IProxyTransport } from '../proxies';


export const FREEPROXY_BASE_META = [
    ...PROXY_TRANSPORT_META, 'key',
];


export const FREEPROXY_BASE_SWAGGER_PROPS = {
    ...PROXY_TRANSPORT_SWAGGER_PROPS,
    key: {
        type: 'string',
        description: 'name of the instance',
        example: 'i-0123456789abcdef1',
    },
};


export interface IFreeproxyBase extends IProxyTransport {
    key: string;
}


export const FREEPROXY_META = [
    ...FREEPROXY_BASE_META,
    ...FINGERPRINT_RESPONSE_META,
    'id',
    'connectorId',
    'projectId',
    'timeoutDisconnected',
    'timeoutUnreachable',
    'disconnectedTs',
];


export const FREEPROXY_SWAGGER_PROPS = {
    ...FREEPROXY_BASE_SWAGGER_PROPS,
    ...FINGERPRINT_RESPONSE_SWAGGER_PROPS,
    id: {
        type: 'string',
        description: 'uuid of the connector + \':\' + key of the freeproxy',
        example: '0b765994-cad3-4b1a-ba65-3af27e69ef47:93.175.130.76',
    },
    connectorId: {
        type: 'string',
        description: 'uuid of the connector',
        example: '0b765994-cad3-4b1a-ba65-3af27e69ef47',
    },
    projectId: {
        type: 'string',
        description: 'uuid of the project',
        example: '7c1d1da2-0271-401f-a4dd-076de4870f8b',
    },
    timeoutDisconnected: {
        type: 'number',
        description: 'maximum duration in ms for connecting to a freeproxy before considering it as offline',
        example: 5000,
    },
    timeoutUnreachable: {
        type: 'number',
        nullable: true,
        description: 'if enabled, maximum duration in ms for a freeproxy to be offline before being removed from the pool, otherwise undefined',
        example: 60000,
    },
    disconnectedTs: {
        type: 'number',
        nullable: true,
        description: 'timestamp of the last disconnection of the freeproxy or undefined if online',
        example: 1711790541000,
    },
};


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


export const FREEPROXIES_TO_REMOVE_OPTIONS_SWAGGER_PROPS = {
    ids: {
        type: 'array',
        items: {
            type: 'string',
            description: 'uuid of the proxy',
            example: 'cca47a38-06b1-4c8c-a620-b7f0f357cd81',
        },
        nullable: true,
    },
    duplicate: {
        type: 'boolean',
        nullable: true,
        description: 'true to remove all duplicates of the freeproxies',
        example: true,
    },
    onlyOffline: {
        type: 'boolean',
        nullable: true,
        description: 'true to remove all offline freeproxies',
        example: false,
    },
};


export interface IFreeproxiesToRemoveOptions {
    ids?: string[];
    duplicate?: boolean;
    onlyOffline?: boolean;
}


export interface IFreeproxiesNextRefreshToUpdate {
    freeproxiesIds: string[];
    nextRefreshTs: number;
}
