import { CommanderRefreshClientService } from '../commander-client';
import type {
    ICertificate,
    IConnectorData,
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IFingerprintOptions,
    IProxyKeyToRemove,
    ITaskToCreate,
} from '@scrapoxy/common';


export interface IConnectorConfig {
    refreshDelay: number;

    useCertificate: boolean;
}


export interface IConnectorFactory {
    type: string;

    config: IConnectorConfig;

    validateCredentialConfig: (config: any) => Promise<void>;

    validateConnectorConfig: (credentialConfig: any, connectorConfig: any) => Promise<void>;

    validateInstallConfig: (config: any) => Promise<void>;

    buildConnectorService: (connector: IConnectorToRefresh, commander: CommanderRefreshClientService) => Promise<IConnectorService>;

    buildInstallCommand: (installId: string, credential: ICredentialData, connector: IConnectorData, certificate: ICertificate | null, fingerprintOptions: IFingerprintOptions, config: any) => Promise<ITaskToCreate>;

    buildUninstallCommand: (credential: ICredentialData, connector: IConnectorData) => Promise<ITaskToCreate>;

    validateInstallCommand: (credential: ICredentialData, connector: IConnectorData) => Promise<void>;

    queryCredential: (credential: ICredentialData, query: ICredentialQuery) => Promise<any>;
}


export interface IConnectorService {
    getProxies: (keys: string[]) => Promise<IConnectorProxyRefreshed[]>;

    createProxies: (count: number, totalCount: number, excludeKeys: string[]) => Promise<IConnectorProxyRefreshed[]>;

    startProxies: (keys: string[], totalCount: number) => Promise<void>;

    removeProxies: (keys: IProxyKeyToRemove[], totalCount: number) => Promise<string[]>;
}
