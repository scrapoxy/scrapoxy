import type {
    ICertificate,
    ICertificateInfo,
} from '../certificate';
import type { IOptionalValue } from '../optional';


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


export const CONNECTOR_VIEW_SWAGGER_PROPS = {
    id: {
        type: 'string',
        description: 'uuid of the connector',
        example: 'faf62e6a-f048-4bec-9415-719cb92c1063',
    },
    projectId: {
        type: 'string',
        description: 'uuid of the project',
        example: 'b87142ec-c86a-4fb5-ad79-5a829b36bf83',
    },
    name: {
        type: 'string',
        description: 'name of the connector',
        example: 'My AWS Connector',
    },
    type: {
        type: 'string',
        description: 'type of provider',
        example: 'aws',
    },
    active: {
        type: 'boolean',
        description: 'true if the connector is active',
        example: true,
    },
    proxiesMax: {
        type: 'number',
        description: 'maximum number of proxies to use',
        example: 10,
    },
    error: {
        type: 'string',
        nullable: true,
        description: 'error message if the connector is in error',
        example: 'too many instances requested',
    },
    certificateEndAt: {
        type: 'number',
        nullable: true,
        description: 'timestamp in ms of the end of the certificate for datacenter provider',
        example: 1711788736000,
    },
};


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
    'proxiesTimeoutUnreachable',
    'config',
];


export interface IConnectorData extends IConnectorView {
    credentialId: string;
    proxiesTimeoutDisconnected: number;
    proxiesTimeoutUnreachable: IOptionalValue<number>;
    config: any;
}


export const CONNECTOR_SYNC_META = [
    ...CONNECTOR_VIEW_META, 'proxiesTimeoutDisconnected', 'proxiesTimeoutUnreachable',
];


export interface IConnectorSync extends IConnectorView {
    proxiesTimeoutDisconnected: number;
    proxiesTimeoutUnreachable: IOptionalValue<number>;
}


export interface IConnectorToUpdate {
    name: string;
    credentialId: string;
    proxiesMax: number;
    proxiesTimeoutDisconnected: number;
    proxiesTimeoutUnreachable: IOptionalValue<number>;
    config: any;
}


export interface IConnectorToCreate extends IConnectorToUpdate {
    certificateDurationInMs: number;
}


export interface IConnectorDataToCreate extends IConnectorData {
    certificate: ICertificate | null;
    certificateEndAt: number | null;
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
    proxiesMax: number;
    error: string | null;
    credentialConfig: any;
    connectorConfig: any;
    certificate: ICertificate | null;
    proxiesKeys: string[];
}


export interface IConnectorToInstall {
    config: any;
}
