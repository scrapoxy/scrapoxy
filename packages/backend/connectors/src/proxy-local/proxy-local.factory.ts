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
import { CONNECTOR_PROXY_LOCAL_TYPE } from '@scrapoxy/common';
import { ProxyLocalApi } from './api';
import { CONNECTOR_PROXY_LOCAL_MODULE_CONFIG } from './proxy-local.constants';
import { ConnectorProxyLocalService } from './proxy-local.service';
import {
    schemaConfig,
    schemaCredential,
} from './proxy-local.validation';
import { TRANSPORT_PROXY_LOCAL_TYPE } from './transport/proxy-local.constants';
import type {
    IConnectorProxyLocalConfig,
    IConnectorProxyLocalCredential,
} from './proxy-local.interface';
import type { IConnectorProxyLocalModuleConfig } from './proxy-local.module';
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
export class ConnectorProxyLocalFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_PROXY_LOCAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 2000,
        transportType: TRANSPORT_PROXY_LOCAL_TYPE,
        useCertificate: false,
    };

    private readonly agents = new Agents();

    constructor(
        @Inject(CONNECTOR_PROXY_LOCAL_MODULE_CONFIG)
        private readonly moduleConfig: IConnectorProxyLocalModuleConfig,
        connectorproviders: ConnectorprovidersService
    ) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorProxyLocalCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        const api = new ProxyLocalApi(
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
        credentialConfig: IConnectorProxyLocalCredential,
        connectorConfig: IConnectorProxyLocalConfig
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
        const service = new ConnectorProxyLocalService(
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
