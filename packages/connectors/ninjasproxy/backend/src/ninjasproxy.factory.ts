import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    TRANSPORT_PROXY_TYPE,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_NINJASPROXY_TYPE } from '@scrapoxy/connector-ninjasproxy-sdk';
import { NinjasproxyApi } from './api';
import { ConnectorNinjasproxyService } from './ninjasproxy.service';
import { schemaCredential } from './ninjasproxy.validation';
import type { IConnectorNinjasproxyCredential } from './ninjasproxy.interface';
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
export class ConnectorNinjasproxyFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_NINJASPROXY_TYPE;

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

    async validateCredentialConfig(config: IConnectorNinjasproxyCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new NinjasproxyApi(
                config.apiKey,
                this.agents
            );

            await api.getAllProxies();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(): Promise<void> {
        // Nothing to validate
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        return new ConnectorNinjasproxyService(
            connector.credentialConfig,
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
