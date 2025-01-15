import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_PROXIDIZE_TYPE } from '@scrapoxy/common';
import { ProxidizeApi } from './api';
import { ConnectorProxidizeService } from './proxidize.service';
import { schemaCredential } from './proxidize.validation';
import type { IConnectorProxidizeCredential } from './proxidize.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorProxidizeFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_PROXIDIZE_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    private readonly agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorProxidizeCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new ProxidizeApi(
                config.apiUrl,
                config.apiToken,
                this.agents
            );

            await api.getDevices();
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
        return new ConnectorProxidizeService(
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
}
