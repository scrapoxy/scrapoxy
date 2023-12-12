import {
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_PROXYLOCAL_TYPE } from '@scrapoxy/connector-proxylocal-sdk';
import { ProxylocalApi } from './api';
import { CONNECTOR_PROXYLOCAL_MODULE_CONFIG } from './proxylocal.constants';
import { ConnectorProxylocalService } from './proxylocal.service';
import {
    schemaConfig,
    schemaCredential,
} from './proxylocal.validation';
import { TRANSPORT_PROXYLOCAL_TYPE } from './transport/proxylocal.constants';
import type {
    IConnectorProxylocalConfig,
    IConnectorProxylocalCredential,
} from './proxylocal.interface';
import type { IConnectorProxylocalModuleConfig } from './proxylocal.module';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorListProxies,
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorProxylocalFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_PROXYLOCAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 2000,
        transportType: TRANSPORT_PROXYLOCAL_TYPE,
        useCertificate: false,
    };

    private readonly agents = new Agents();

    constructor(
        @Inject(CONNECTOR_PROXYLOCAL_MODULE_CONFIG)
        private readonly moduleConfig: IConnectorProxylocalModuleConfig,
        connectorproviders: ConnectorprovidersService
    ) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorProxylocalCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        const api = new ProxylocalApi(
            this.moduleConfig.url,
            config.token,
            this.agents
        );
        try {
            await api.getAllSessions();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorProxylocalCredential,
        connectorConfig: IConnectorProxylocalConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        const service = new ConnectorProxylocalService(
            this.moduleConfig.url,
            connector.credentialConfig,
            this.agents
        );

        return service;
    }

    async buildInstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async buildUninstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async validateInstallCommand(): Promise<void> {
        // Nothing
    }

    async queryCredential(): Promise<any> {
        throw new Error('Not implemented');
    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }
}
