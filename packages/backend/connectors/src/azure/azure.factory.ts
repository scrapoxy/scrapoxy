import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorCertificateNotFoundError,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    TasksService,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_AZURE_TYPE,
    EAzureQueryCredential,
    randomName,
} from '@scrapoxy/common';
import { AzureApi } from './api';
import { ConnectorAzureService } from './azure.service';
import {
    schemaConfig,
    schemaCredential,
} from './azure.validation';
import {
    AzureInstallFactory,
    AzureUninstallFactory,
} from './tasks';
import type {
    IAzureVmSize,
    IConnectorAzureConfig,
    IConnectorAzureCredential,
} from './azure.interface';
import type {
    IAzureInstallCommandData,
    IAzureUninstallCommandData,
} from './tasks';
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
    IFingerprintOptions,
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

    constructor(
        connectorproviders: ConnectorprovidersService,
        tasks: TasksService
    ) {
        connectorproviders.register(this);

        tasks.register(
            AzureInstallFactory.type,
            new AzureInstallFactory(this.agents)
        );

        tasks.register(
            AzureUninstallFactory.type,
            new AzureUninstallFactory(this.agents)
        );
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
            this.agents
        );

        return service;
    }


    async buildInstallCommand(
        installId: string,
        credential: ICredentialData,
        connector: IConnectorData,
        certificate: ICertificate | null,
        fingerprintOptions: IFingerprintOptions
    ): Promise<ITaskToCreate> {
        if (!certificate) {
            throw new ConnectorCertificateNotFoundError(
                connector.projectId,
                connector.id
            );
        }

        const
            connectorConfig = connector.config as IConnectorAzureConfig,
            credentialConfig = credential.config as IConnectorAzureCredential;
        const data: IAzureInstallCommandData = {
            tenantId: credentialConfig.tenantId,
            clientId: credentialConfig.clientId,
            secret: credentialConfig.secret,
            subscriptionId: credentialConfig.subscriptionId,
            location: connectorConfig.location,
            hostname: void 0,
            port: connectorConfig.port,
            certificate,
            resourceGroupName: connectorConfig.resourceGroupName,
            vmName: randomName(),
            vmSize: connectorConfig.vmSize,
            storageAccountType: connectorConfig.storageAccountType,
            vmDeploymentName: void 0,
            prefix: connectorConfig.prefix,
            imageDeploymentName: void 0,
            imageResourceGroupName: connectorConfig.imageResourceGroupName,
            fingerprintOptions,
            installId,
        };
        const taskToCreate: ITaskToCreate = {
            type: AzureInstallFactory.type,
            name: `Install Azure on connector ${connector.name} in location ${connectorConfig.location}`,
            stepMax: AzureInstallFactory.stepMax,
            message: 'Installing Azure connector...',
            data,
        };

        return taskToCreate;
    }

    async buildUninstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<ITaskToCreate> {
        const
            connectorConfig = connector.config as IConnectorAzureConfig,
            credentialConfig = credential.config as IConnectorAzureCredential;
        const data: IAzureUninstallCommandData = {
            tenantId: credentialConfig.tenantId,
            clientId: credentialConfig.clientId,
            secret: credentialConfig.secret,
            subscriptionId: credentialConfig.subscriptionId,
            resourceGroupName: connectorConfig.resourceGroupName,
            imageResourceGroupName: connectorConfig.imageResourceGroupName,
        };
        const taskToCreate: ITaskToCreate = {
            type: AzureUninstallFactory.type,
            name: `Uninstall Azure on connector ${connector.name} in location ${connectorConfig.location}`,
            stepMax: AzureUninstallFactory.stepMax,
            message: 'Uninstalling Azure connector...',
            data,
        };

        return taskToCreate;
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

            await api.getImage(
                connectorConfig.imageResourceGroupName,
                connectorConfig.prefix
            );
        } catch (err: any) {
            throw new ConnectorInvalidError(err.message);
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
                throw new CredentialQueryNotFoundError(query.type);
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
