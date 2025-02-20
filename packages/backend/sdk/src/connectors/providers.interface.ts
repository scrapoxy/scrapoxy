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

    // TODO: to remove
    validateInstallConfig: (config: any) => Promise<void>;

    buildConnectorService: (connector: IConnectorToRefresh, commander: CommanderRefreshClientService) => Promise<IConnectorService>;

    // TODO: to remove
    buildInstallCommand: (installId: string, credential: ICredentialData, connector: IConnectorData, certificate: ICertificate | null, fingerprintOptions: IFingerprintOptions, config: any) => Promise<ITaskToCreate>;

    // TODO: to remove
    buildUninstallCommand: (credential: ICredentialData, connector: IConnectorData) => Promise<ITaskToCreate>;

    // TODO: to rename (because this is more a pre-start command check)
    validateInstallCommand: (credential: ICredentialData, connector: IConnectorData) => Promise<void>;

    queryCredential: (credential: ICredentialData, query: ICredentialQuery) => Promise<any>;
}


export interface IConnectorService {
    getProxies: (keys: string[]) => Promise<IConnectorProxyRefreshed[]>;

    createProxies: (count: number, totalCount: number, excludeKeys: string[]) => Promise<IConnectorProxyRefreshed[]>;

    startProxies: (keys: string[], totalCount: number) => Promise<void>;

    removeProxies: (keys: IProxyKeyToRemove[], totalCount: number) => Promise<string[]>;
}
