import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_RAYOBYTE_TYPE,
    ERayobyteQueryCredential,
} from '@scrapoxy/common';
import { RayobyteApi } from './api';
import { ConnectorRayobyteService } from './rayobyte.service';
import {
    schemaConfig,
    schemaCredential,
} from './rayobyte.validation';
import type {
    IConnectorRayobyteConfig,
    IConnectorRayobyteCredential,
} from './rayobyte.interface';
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
export class ConnectorRayobyteFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_RAYOBYTE_TYPE;

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

    async validateCredentialConfig(config: IConnectorRayobyteCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new RayobyteApi(
                config.email,
                config.apiKey,
                this.agents
            );

            await api.getAvailableReplacements();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorRayobyteCredential,
        connectorConfig: IConnectorRayobyteConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        try {
            const api = new RayobyteApi(
                credentialConfig.email,
                credentialConfig.apiKey,
                this.agents
            );

            await api.exportProxies(connectorConfig.packageFilter);
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        return new ConnectorRayobyteService(
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
        const credentialConfig = credential.config as IConnectorRayobyteCredential;

        switch (query.type) {
            case ERayobyteQueryCredential.Packages: {
                return this.queryPackages(credentialConfig);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    private async queryPackages(credentialConfig: IConnectorRayobyteCredential): Promise<string[]> {
        const api = new RayobyteApi(
            credentialConfig.email,
            credentialConfig.apiKey,
            this.agents
        );
        const replacements = await api.getAvailableReplacements();
        const packages = replacements.map((r) => `${r.country}-${r.category}`);

        return packages;
    }
}
