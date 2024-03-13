import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    TRANSPORT_PROXY_TYPE,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_PROXY_CHEAP_SERVER_TYPE } from '@scrapoxy/common';
import { ProxyCheapServerApi } from './api';
import { EProxyCheapNetworkType } from './pc-server.interface';
import { ConnectorProxyCheapServerService } from './pc-server.service';
import {
    schemaConfig,
    schemaCredential,
} from './pc-server.validation';
import type {
    IConnectorProxyCheapServerConfig,
    IConnectorProxyCheapServerCredential,
} from './pc-server.interface';
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
export class ConnectorProxyCheapServerFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_PROXY_CHEAP_SERVER_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_PROXY_TYPE,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorProxyCheapServerCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new ProxyCheapServerApi(
                config.key,
                config.secret,
                this.agents
            );

            await api.getAllProxies(EProxyCheapNetworkType.ALL);
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorProxyCheapServerCredential,
        connectorConfig: IConnectorProxyCheapServerConfig
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
        return new ConnectorProxyCheapServerService(
            connector.credentialConfig,
            connector.connectorConfig,
            this.agents
        );
    }

    async buildInstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async buildUninstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async validateInstallCommand(): Promise<void> {
        // Nothing to install
    }

    async queryCredential(): Promise<any> {
        throw new Error('Not implemented');
    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }
}
