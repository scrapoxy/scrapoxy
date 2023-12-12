import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    TRANSPORT_PROXY_TYPE,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_TYPE,
    EIproyalQueryCredential,
} from '@scrapoxy/connector-iproyal-sdk';
import { IproyalApi } from './api';
import { ConnectorIproyalService } from './iproyal.service';
import {
    schemaConfig,
    schemaCredential,
} from './iproyal.validation';
import type {
    IConnectorIproyalConfig,
    IConnectorIproyalCredential,
} from './iproyal.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorListProxies,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorIproyalFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_IPROYAL_TYPE;

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

    async validateCredentialConfig(config: IConnectorIproyalCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new IproyalApi(
                config.token,
                this.agents
            );

            await api.getMyProduct();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorIproyalCredential,
        connectorConfig: IConnectorIproyalConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        try {
            const api = new IproyalApi(
                credentialConfig.token,
                this.agents
            );

            await api.getAllProxies(
                connectorConfig.product,
                connectorConfig.country
            );
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        return new ConnectorIproyalService(
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

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorIproyalCredential;

        switch (query.type) {
            case EIproyalQueryCredential.Products: {
                return this.queryProducts(credentialConfig);
            }

            case EIproyalQueryCredential.Countries: {
                return this.queryCountries(credentialConfig);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }

    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }

    private async queryProducts(credentialConfig: IConnectorIproyalCredential): Promise<string[]> {
        const api = new IproyalApi(
            credentialConfig.token,
            this.agents
        );
        const products = await api.getMyProduct();

        return products;
    }

    private async queryCountries(credentialConfig: IConnectorIproyalCredential): Promise<string[]> {
        const api = new IproyalApi(
            credentialConfig.token,
            this.agents
        );
        const countries = await api.getMyCountries();

        return countries;
    }
}
