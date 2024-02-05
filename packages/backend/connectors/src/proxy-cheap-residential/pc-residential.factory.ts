import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE } from '@scrapoxy/common';
import { ConnectorProxyCheapService } from './pc-residential.service';
import {
    schemaConfig,
    schemaCredential,
} from './pc-residential.validation';
import { TRANSPORT_PROXY_CHEAP_RESIDENTIAL_TYPE } from './transport/pc-residential.constants';
import type {
    IConnectorProxyCheapResidentialConfig,
    IConnectorProxyCheapResidentialCredential,
} from './pc-residential.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorListProxies,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorProxyCheapResidentialFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_PROXY_CHEAP_RESIDENTIAL_TYPE,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorProxyCheapResidentialCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorProxyCheapResidentialCredential,
        connectorConfig: IConnectorProxyCheapResidentialConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(): Promise<IConnectorService> {
        return new ConnectorProxyCheapService();
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
