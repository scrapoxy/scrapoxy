import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_SELLER_SERVER_TYPE,
    EProxySellerServerQueryCredential,
} from '@scrapoxy/common';
import { ProxySellerServerApi } from './api';
import { ConnectorProxySellerServerService } from './ps-server.service';
import {
    schemaConfig,
    schemaCredential,
} from './ps-server.validation';
import type {
    IConnectorProxySellerServerConfig,
    IConnectorProxySellerServerCredential,
} from './ps-server.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxySellerServerQueryType,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IIsocodeCountry,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorProxySellerServerFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_PROXY_SELLER_SERVER_TYPE;

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

    async validateCredentialConfig(config: IConnectorProxySellerServerCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new ProxySellerServerApi(
                config.token,
                this.agents
            );

            await api.ping();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorProxySellerServerCredential,
        connectorConfig: IConnectorProxySellerServerConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        try {
            const api = new ProxySellerServerApi(
                credentialConfig.token,
                this.agents
            );
            const proxies = await api.getAllProxies(
                connectorConfig.networkType,
                connectorConfig.country !== 'all' ? connectorConfig.country.toUpperCase() : void 0
            );

            if (proxies.length <= 0) {
                throw new Error('No proxies available this configuration');
            }
        } catch (err: any) {
            throw new ConnectorInvalidError(err.message);
        }
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        return new ConnectorProxySellerServerService(
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
        const credentialConfig = credential.config as IConnectorProxySellerServerCredential;

        switch (query.type) {
            case EProxySellerServerQueryCredential.Countries: {
                return this.queryCountries(
                    credentialConfig,
                    query.parameters as IConnectorProxySellerServerQueryType
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryCountries(
        credentialConfig: IConnectorProxySellerServerCredential,
        parameters: IConnectorProxySellerServerQueryType
    ): Promise<IIsocodeCountry[]> {
        const api = new ProxySellerServerApi(
            credentialConfig.token,
            this.agents
        );
        const proxies = await api.getAllProxies(parameters.networkType);
        const countries: IIsocodeCountry[] = proxies.map((p) => ({
            code: p.country_alpha3.toLowerCase(),
            name: p.country,
        }));
        // Remove duplicates
        const countriesFiltered = countries.filter((
            c, index
        ) => countries.findIndex((f) => f.code === c.code) === index);

        return countriesFiltered;
    }
}
