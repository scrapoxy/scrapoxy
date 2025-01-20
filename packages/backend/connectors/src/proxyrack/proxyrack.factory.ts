import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXYRACK_TYPE,
    EProxyrackQueryCredential,
} from '@scrapoxy/common';
import { ProxyrackApi } from './api';
import { ConnectorProxyrackService } from './proxyrack.service';
import {
    schemaConfig,
    schemaCredential,
} from './proxyrack.validation';
import type {
    IConnectorProxyrackConfig,
    IConnectorProxyrackCredential,
} from './proxyrack.interface';
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
    IProxyrackQueryByCountry,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorProxyrackFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_PROXYRACK_TYPE;

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

    async validateCredentialConfig(config: IConnectorProxyrackCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new ProxyrackApi(
                config.product,
                config.username,
                config.password,
                this.agents
            );

            await api.listAllSessions();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorProxyrackCredential,
        connectorConfig: IConnectorProxyrackConfig
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
        return new ConnectorProxyrackService(
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
        const credentialConfig = credential.config as IConnectorProxyrackCredential;

        switch (query.type) {
            case EProxyrackQueryCredential.Countries: {
                return this.queryCountries(credentialConfig);
            }

            case EProxyrackQueryCredential.Cities: {
                return this.queryCities(
                    credentialConfig,
                    query.parameters as IProxyrackQueryByCountry
                );
            }

            case EProxyrackQueryCredential.Isps: {
                return this.queryIsps(
                    credentialConfig,
                    query.parameters as IProxyrackQueryByCountry
                );
            }

            case EProxyrackQueryCredential.ProxiesCount: {
                return this.queryProxiesCount(
                    credentialConfig,
                    query.parameters as IProxyrackQueryByCountry
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }

    }

    private async queryCountries(credentialConfig: IConnectorProxyrackCredential): Promise<string[]> {
        const api = new ProxyrackApi(
            credentialConfig.product,
            credentialConfig.username,
            credentialConfig.password,
            this.agents
        );
        const countries = await api.listCountries();

        return countries;
    }

    private async queryCities(
        credentialConfig: IConnectorProxyrackCredential,
        parameters: IProxyrackQueryByCountry
    ): Promise<string[]> {
        const api = new ProxyrackApi(
            credentialConfig.product,
            credentialConfig.username,
            credentialConfig.password,
            this.agents
        );
        const cities = await api.listCities(parameters.country);

        return cities;
    }

    private async queryIsps(
        credentialConfig: IConnectorProxyrackCredential,
        parameters: IProxyrackQueryByCountry
    ): Promise<string[]> {
        const api = new ProxyrackApi(
            credentialConfig.product,
            credentialConfig.username,
            credentialConfig.password,
            this.agents
        );
        const isps = await api.listIsps(parameters.country);

        return isps;
    }

    private async queryProxiesCount(
        credentialConfig: IConnectorProxyrackCredential,
        parameters: IProxyrackQueryByCountry
    ): Promise<number> {
        const api = new ProxyrackApi(
            credentialConfig.product,
            credentialConfig.username,
            credentialConfig.password,
            this.agents
        );
        const count = await api.getProxiesCountByCountry(parameters.country);

        return count;
    }
}
