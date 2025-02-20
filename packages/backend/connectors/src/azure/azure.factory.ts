import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_AZURE_TYPE,
    EAzureQueryCredential,
} from '@scrapoxy/common';
import { AzureApi } from './api';
import { ConnectorAzureService } from './azure.service';
import {
    schemaConfig,
    schemaCredential,
} from './azure.validation';
import type {
    IAzureVmSize,
    IConnectorAzureConfig,
    IConnectorAzureCredential,
} from './azure.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IAzureLocation,
    IAzureQueryVmSizes,
    ICertificate,
    IConnectorData,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ITaskToCreate,
} from '@scrapoxy/common';


const FILTER_VM_SIZES = [
    'Standard_B1ls',
    'Standard_B1s',
    'Standard_B2s',
    'Standard_A1_v2',
    'Standard_D2plds_v5',
];


@Injectable()
export class ConnectorAzureFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_AZURE_TYPE;

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

    async validateCredentialConfig(config: IConnectorAzureCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new AzureApi(
                config.tenantId,
                config.clientId,
                config.secret,
                config.subscriptionId,
                this.agents
            );

            await api.listLocations();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorAzureCredential,
        connectorConfig: IConnectorAzureConfig
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
        const service = new ConnectorAzureService(
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

    async validateInstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<void> {
        const connectorConfig = connector.config as IConnectorAzureConfig;
        const credentialConfig = credential.config as IConnectorAzureCredential;
        const api = new AzureApi(
            credentialConfig.tenantId,
            credentialConfig.clientId,
            credentialConfig.secret,
            credentialConfig.subscriptionId,
            this.agents
        );

        try {
            await api.getResourceGroup(connectorConfig.resourceGroupName);
        } catch (err: any) {
            try {
                await api.createResourceGroup(
                    connectorConfig.resourceGroupName,
                    connectorConfig.location
                );
            } catch (err2: any) {
                throw new ConnectorInvalidError(err2.message);
            }
        }
    }

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorAzureCredential;

        switch (query.type) {
            case EAzureQueryCredential.Locations: {
                return this.queryLocations(credentialConfig);
            }

            case EAzureQueryCredential.VmSizes: {
                return this.queryVmSizes(
                    credentialConfig,
                    query.parameters as IAzureQueryVmSizes
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryLocations(credentialConfig: IConnectorAzureCredential): Promise<IAzureLocation[]> {
        const api = new AzureApi(
            credentialConfig.tenantId,
            credentialConfig.clientId,
            credentialConfig.secret,
            credentialConfig.subscriptionId,
            this.agents
        );
        const locations = await api.listLocations();

        return locations.map((l)=> ({
            name: l.name as string,
            description: l.displayName as string,
        }));
    }

    private async queryVmSizes(
        credentialConfig: IConnectorAzureCredential,
        parameters: IAzureQueryVmSizes
    ): Promise<IAzureVmSize[]> {
        const api = new AzureApi(
            credentialConfig.tenantId,
            credentialConfig.clientId,
            credentialConfig.secret,
            credentialConfig.subscriptionId,
            this.agents
        );
        const sizes = await api.listVmSizes(parameters.location);

        return sizes
            .filter((s) => FILTER_VM_SIZES.includes(s.name as string))
            .map((s) => ({
                id: s.id as string,
                name: s.name as string,
                numberOfCores: s.numberOfCores as number,
                memoryInMB: s.memoryInMB as number,
            }));
    }
}
