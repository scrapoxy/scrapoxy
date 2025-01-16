import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_GEONODE_TYPE,
    EGeonodeProductType,
    EGeonodeQueryCredential,
} from '@scrapoxy/common';
import { GeonodeApi } from './api';
import { ConnectorGeonodeService } from './geonode.service';
import {
    schemaConfig,
    schemaCredential,
} from './geonode.validation';
import type {
    IConnectorGeonodeConfig,
    IConnectorGeonodeCredential,
} from './geonode.interface';
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
    IGeonodeQueryCountries,
    IIsocodeCountry,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorGeonodeFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_GEONODE_TYPE;

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

    async validateCredentialConfig(config: IConnectorGeonodeCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new GeonodeApi(
                config.username,
                config.password,
                this.agents
            );

            await api.getCountries(EGeonodeProductType.RESIDENTIAL_PREMIUM);
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorGeonodeCredential,
        connectorConfig: IConnectorGeonodeConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        try {
            const api = new GeonodeApi(
                credentialConfig.username,
                credentialConfig.password,
                this.agents
            );

            if (connectorConfig.country !== 'all') {
                const countries = await api.getCountries(connectorConfig.productType);
                const countryFound = countries.find((c) => c.code === connectorConfig.country);

                if (!countryFound) {
                    throw new Error(`Country ${connectorConfig.country} not found`);
                }
            }
        } catch (err: any) {
            throw new ConnectorInvalidError(err.message);
        }
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        return new ConnectorGeonodeService(
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
        const credentialConfig = credential.config as IConnectorGeonodeCredential;

        switch (query.type) {
            case EGeonodeQueryCredential.Countries: {
                return this.queryCountries(
                    credentialConfig,
                    query.parameters as IGeonodeQueryCountries
                );
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    private async queryCountries(
        credentialConfig: IConnectorGeonodeCredential,
        parameters: IGeonodeQueryCountries
    ): Promise<IIsocodeCountry[]> {
        const api = new GeonodeApi(
            credentialConfig.username,
            credentialConfig.password,
            this.agents
        );
        const countries = await api.getCountries(parameters.productType);

        return countries;
    }
}
