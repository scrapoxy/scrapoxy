import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_SERVER_TYPE,
    EIproyalServerQueryCredential,
} from '@scrapoxy/common';
import { IproyalServerApi } from './api';
import { ConnectorIproyalService } from './iproyal-server.service';
import {
    schemaConfig,
    schemaCredential,
} from './iproyal-server.validation';
import type {
    IConnectorIproyalServerConfig,
    IConnectorIproyalServerCredential,
} from './iproyal-server.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorIproyalServerFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_IPROYAL_SERVER_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorIproyalServerCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new IproyalServerApi(
                config.token,
                this.agents
            );

            await api.getMyProduct();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorIproyalServerCredential,
        connectorConfig: IConnectorIproyalServerConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        try {
            const api = new IproyalServerApi(
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
        const credentialConfig = credential.config as IConnectorIproyalServerCredential;

        switch (query.type) {
            case EIproyalServerQueryCredential.Products: {
                return this.queryProducts(credentialConfig);
            }

            case EIproyalServerQueryCredential.Countries: {
                return this.queryCountries(credentialConfig);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    private async queryProducts(credentialConfig: IConnectorIproyalServerCredential): Promise<string[]> {
        const api = new IproyalServerApi(
            credentialConfig.token,
            this.agents
        );
        const products = await api.getMyProduct();

        return products;
    }

    private async queryCountries(credentialConfig: IConnectorIproyalServerCredential): Promise<string[]> {
        const api = new IproyalServerApi(
            credentialConfig.token,
            this.agents
        );
        const countries = await api.getMyCountries();

        return countries;
    }
}
