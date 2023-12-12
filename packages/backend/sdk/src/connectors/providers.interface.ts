import { CommanderRefreshClientService } from '../commander-client';
import type {
    ICertificate,
    IConnectorData,
    IConnectorListProxies,
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ICredentialToCreateCallback,
    IFingerprintOptions,
    IProxyKeyToRemove,
    ITaskToCreate,
} from '@scrapoxy/common';


export interface IConnectorConfig {
    refreshDelay: number;

    transportType: string;

    useCertificate: boolean;
}


export interface IConnectorFactory {
    type: string;

    config: IConnectorConfig;

    validateCredentialConfig: (config: any) => Promise<void>;

    validateCredentialCallback: (credentialToCreate: ICredentialToCreateCallback) => Promise<any>;

    validateConnectorConfig: (credentialConfig: any, connectorConfig: any) => Promise<void>;

    validateInstallConfig: (config: any) => Promise<void>;

    buildConnectorService: (connector: IConnectorToRefresh, commander: CommanderRefreshClientService) => Promise<IConnectorService>;

    buildInstallCommand: (installId: string, credential: ICredentialData, connector: IConnectorData, certificate: ICertificate | null, fingerprintOptions: IFingerprintOptions, config: any) => Promise<ITaskToCreate>;

    buildUninstallCommand: (credential: ICredentialData, connector: IConnectorData) => Promise<ITaskToCreate>;

    validateInstallCommand: (credential: ICredentialData, connector: IConnectorData) => Promise<void>;

    queryCredential: (credential: ICredentialData, query: ICredentialQuery) => Promise<any>;

    listAllProxies: (credentialConfig: any) => Promise<IConnectorListProxies>;
}


export interface IConnectorService {
    getProxies: (keys: string[]) => Promise<IConnectorProxyRefreshed[]>;

    createProxies: (count: number, excludeKeys: string[]) => Promise<IConnectorProxyRefreshed[]>;

    startProxies: (keys: string[]) => Promise<void>;

    removeProxies: (keys: IProxyKeyToRemove[]) => Promise<string[]>;
}
