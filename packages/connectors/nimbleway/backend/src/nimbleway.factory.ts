import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialQueryNotFoundError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_NIMBLEWAY_TYPE,
    ENimblewayQueryCredential,
} from '@scrapoxy/connector-nimbleway-sdk';
import { NimblewayApi } from './api';
import { ConnectorNimblewayService } from './nimbleway.service';
import {
    schemaConfig,
    schemaCredential,
} from './nimbleway.validation';
import { TRANSPORT_NIMBLEWAY_TYPE } from './transport/nimbleway.constants';
import type {
    IConnectorNimblewayConfig,
    IConnectorNimblewayCredential,
} from './nimbleway.interface';
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
    ITaskToCreate,
} from '@scrapoxy/common';
import type { INimblewayGeoItem } from '@scrapoxy/connector-nimbleway-sdk';


@Injectable()
export class ConnectorNimblewayFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_NIMBLEWAY_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_NIMBLEWAY_TYPE,
        useCertificate: false,
    };

    private readonly agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorNimblewayCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorNimblewayCredential,
        connectorConfig: IConnectorNimblewayConfig
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
        return new ConnectorNimblewayService();
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
        switch (query.type) {
            case ENimblewayQueryCredential.Countries: {
                return this.queryCountries();
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }

    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }

    private async queryCountries(): Promise<INimblewayGeoItem[]> {
        const api = new NimblewayApi(this.agents);
        const countries = await api.listCountries();

        return countries;
    }
}
