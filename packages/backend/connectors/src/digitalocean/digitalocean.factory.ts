import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_DIGITALOCEAN_TYPE,
    EDigitalOceanQueryCredential,
} from '@scrapoxy/common';
import { DigitalOceanApi } from './api';
import {
    toDigitalOceanRegionView,
    toDigitalOceanSizeView,
} from './digitalocean.helpers';
import { ConnectorDigitaloceanService } from './digitalocean.service';
import {
    schemaConfig,
    schemaCredential,
} from './digitalocean.validation';
import type {
    IConnectorDigitalOceanConfig,
    IConnectorDigitalOceanCredential,
} from './digitalocean.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IDigitalOceanQuerySizes,
    IDigitalOceanRegionView,
    IDigitalOceanSizeView,
    ITaskToCreate,
} from '@scrapoxy/common';


const FILTER_SIZES = [
    's-1vcpu-1gb', 's-1vcpu-2gb', 's-2vcpu-2gb',
];


@Injectable()
export class ConnectorDigitaloceanFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_DIGITALOCEAN_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: true,
    };

    private readonly agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorDigitalOceanCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new DigitalOceanApi(
                config.token,
                this.agents
            );

            await api.getAccount();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorDigitalOceanCredential,
        connectorConfig: IConnectorDigitalOceanConfig
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
        const service = new ConnectorDigitaloceanService(
            connector.credentialConfig,
            connector.connectorConfig,
            connector.certificate as ICertificate,
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
        // Nothing to install
    }

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorDigitalOceanCredential;

        switch (query.type) {
            case EDigitalOceanQueryCredential.Regions: {
                return this.queryRegions(credentialConfig);
            }

            case EDigitalOceanQueryCredential.Sizes: {
                return this.querySizes(
                    credentialConfig,
                    query.parameters as IDigitalOceanQuerySizes
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryRegions(credentialConfig: IConnectorDigitalOceanCredential): Promise<IDigitalOceanRegionView[]> {
        const api = new DigitalOceanApi(
            credentialConfig.token,
            this.agents
        );
        const regions = await api.getAllRegions();

        return regions
            .filter((r) => r.available)
            .map(toDigitalOceanRegionView);
    }

    private async querySizes(
        credentialConfig: IConnectorDigitalOceanCredential,
        parameters: IDigitalOceanQuerySizes
    ): Promise<IDigitalOceanSizeView[]> {
        const api = new DigitalOceanApi(
            credentialConfig.token,
            this.agents
        );
        const sizes = await api.getAllSizes();

        return sizes
            .filter((s) =>
                s.available &&
                FILTER_SIZES.includes(s.slug) &&
                s.regions.includes(parameters.region))
            .map(toDigitalOceanSizeView);
    }
}
