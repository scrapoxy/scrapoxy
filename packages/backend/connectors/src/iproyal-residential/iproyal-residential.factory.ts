import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
    EIproyalResidentialQueryCredential,
} from '@scrapoxy/common';
import { IproyalResidentialApi } from './api';
import { ConnectorIproyalService } from './iproyal-residential.service';
import {
    schemaConfig,
    schemaCredential,
} from './iproyal-residential.validation';
import { TRANSPORT_IPROYAL_RESIDENTIAL_TYPE } from './transport/iproyal-residential.constants';
import type {
    IConnectorIproyalResidentialConfig,
    IConnectorIproyalResidentialCredential,
} from './iproyal-residential.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorListProxies,
    ICredentialData,
    ICredentialQuery,
    IIproyalResidentialCountries,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorIproyalResidentialFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_IPROYAL_RESIDENTIAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_IPROYAL_RESIDENTIAL_TYPE,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorIproyalResidentialCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new IproyalResidentialApi(
                config.token,
                this.agents
            );

            await api.generateProxyList(
                config.username,
                config.password
            );
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorIproyalResidentialCredential,
        connectorConfig: IConnectorIproyalResidentialConfig
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
        return new ConnectorIproyalService();
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
        const credentialConfig = credential.config as IConnectorIproyalResidentialCredential;

        switch (query.type) {
            case EIproyalResidentialQueryCredential.Countries: {
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

    private async queryCountries(credentialConfig: IConnectorIproyalResidentialCredential): Promise<IIproyalResidentialCountries> {
        const api = new IproyalResidentialApi(
            credentialConfig.token,
            this.agents
        );
        const countries = await api.getAllCountries();

        return countries;
    }
}
