import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    TRANSPORT_PROXY_TYPE,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_HYPEPROXY_TYPE } from '@scrapoxy/common';
import { HypeproxyApi } from './api';
import { ConnectorHypeproxyService } from './hypeproxy.service';
import { schemaCredential } from './hypeproxy.validation';
import type { IConnectorHypeproxyCredential } from './hypeproxy.interface';
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
export class ConnectorHypeproxyFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_HYPEPROXY_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_PROXY_TYPE,
        useCertificate: false,
    };

    private readonly agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorHypeproxyCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new HypeproxyApi(
                config.token,
                this.agents
            );

            await api.getInformations();
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
        return new ConnectorHypeproxyService(
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
