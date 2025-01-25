import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_EVOMI_TYPE,
    EEvomiProduct,
    EEvomiQueryCredential,
} from '@scrapoxy/common';
import { EvomiApi } from './api';
import { ConnectorEvomiResidentialService } from './evomi-residential.service';
import { ConnectorEvomiServerService } from './evomi-server.service';
import {
    schemaConfig,
    schemaCredential,
} from './evomi.validation';
import type {
    IConnectorEvomiConfig,
    IConnectorEvomiCredential,
    IEvomiProductResidential,
    IEvomiProductServer,
} from './evomi.interface';
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
    IEvomiProduct,
    IEvomiQueryProduct,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorEvomiFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_EVOMI_TYPE;

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

    async validateCredentialConfig(config: IConnectorEvomiCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new EvomiApi(
                config.apiKey,
                this.agents
            );

            await api.getAllProducts();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorEvomiCredential,
        connectorConfig: IConnectorEvomiConfig
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
        const config = connector.connectorConfig as IConnectorEvomiConfig;

        if (config.product === EEvomiProduct.StaticResidential) {
            return new ConnectorEvomiServerService(
                connector.credentialConfig,
                connector.connectorConfig,
                this.agents
            );
        } else {
            return new ConnectorEvomiResidentialService(config);
        }
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
        const credentialConfig = credential.config as IConnectorEvomiCredential;

        switch (query.type) {
            case EEvomiQueryCredential.Products: {
                return this.queryProducts(credentialConfig);
            }

            case EEvomiQueryCredential.Product: {
                return this.queryProduct(
                    credentialConfig,
                    query.parameters
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryProducts(credentialConfig: IConnectorEvomiCredential): Promise<EEvomiProduct[]> {
        const api = new EvomiApi(
            credentialConfig.apiKey,
            this.agents
        );
        const products = await api.getAllProducts();

        return products as EEvomiProduct[];
    }

    private async queryProduct(
        credentialConfig: IConnectorEvomiCredential,
        parameters: IEvomiQueryProduct
    ): Promise<IEvomiProduct> {
        const api = new EvomiApi(
            credentialConfig.apiKey,
            this.agents
        );

        if (parameters.product === EEvomiProduct.StaticResidential) {
            const product = await api.getProductResidential(parameters.product) as IEvomiProductServer;
            const countries = new Set<string>();
            for (const pkg of product.packages ?? []) {
                for (const ip of pkg.ips ?? []) {
                    if (ip?.ipInfo?.country) {
                        countries.add(ip.ipInfo.country);
                    }
                }
            }

            return {
                port: 0,
                countries: Array.from(countries),
            };
        } else {
            const [
                product, countries,
            ] = await Promise.all([
                api.getProductResidential(parameters.product) as Promise<IEvomiProductResidential>, api.getCountriesCodeByProduct(parameters.product),
            ]);

            return {
                hostname: product.endpoint,
                port: product.ports.http,
                username: product.username,
                password: product.password,
                countries,
            };
        }
    }
}
