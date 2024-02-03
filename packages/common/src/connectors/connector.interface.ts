import type {
    ICertificate,
    ICertificateInfo,
} from '../certificate';
import type { IProxyInfo } from '../proxies';


export interface IConnectorScale {
    proxiesMax: number;
}


export interface IConnectorActive {
    active: boolean;
}


export interface IConnectorError {
    error: string | null;
}


export const CONNECTOR_VIEW_META = [
    'id',
    'projectId',
    'name',
    'type',
    'active',
    'proxiesMax',
    'error',
    'certificateEndAt',
];


export interface IConnectorView {
    id: string;
    projectId: string;
    name: string;
    type: string;
    active: boolean;
    proxiesMax: number;
    error: string | null;
    certificateEndAt: number | null;
}


export const CONNECTOR_DATA_META = [
    ...CONNECTOR_VIEW_META,
    'credentialId',
    'proxiesTimeoutDisconnected',
    'config',
];


export interface IConnectorData extends IConnectorView {
    credentialId: string;
    proxiesTimeoutDisconnected: number;
    config: any;
}


export const CONNECTOR_SYNC_META = [
    ...CONNECTOR_VIEW_META, 'proxiesTimeoutDisconnected',
];


export interface IConnectorSync extends IConnectorView {
    proxiesTimeoutDisconnected: number;
}


export interface IConnectorToCreate {
    name: string;
    credentialId: string;
    proxiesMax: number;
    proxiesTimeoutDisconnected: number;
    config: any;
    certificateDurationInMs: number;
}


export interface IConnectorDataToCreate extends IConnectorData {
    certificate: ICertificate | null;
    certificateEndAt: number | null;
}


export interface IConnectorToUpdate {
    name: string;
    credentialId: string;
    proxiesMax: number;
    proxiesTimeoutDisconnected: number;
    config: any;
}


export interface IConnectorCertificateToUpdate {
    projectId: string;
    connectorId: string;
    certificateInfo: ICertificateInfo;
}


export interface IConnectorNextRefreshToUpdate {
    projectId: string;
    connectorId: string;
    nextRefreshTs: number;
}


export interface IConnectorToRefresh {
    id: string;
    projectId: string;
    name: string;
    type: string;
    error: string | null;
    credentialConfig: any;
    connectorConfig: any;
    certificate: ICertificate | null;
    proxiesKeys: string[];
}


export interface IConnectorToInstall {
    config: any;
}


export interface IConnectorListProxies {
    proxies: IProxyInfo[];

    errors: string[];
}
