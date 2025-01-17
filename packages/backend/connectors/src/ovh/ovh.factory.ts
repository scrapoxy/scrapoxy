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
    CONNECTOR_OVH_TYPE,
    EOvhQueryCredential,
} from '@scrapoxy/common';
import { OvhApi } from './api';
import {
    toOvhFlavorView,
    toOvhProjectView,
    toOvhRegionView,
    toOvhSnapshotView,
} from './ovh.helpers';
import {
    EOvhFlavorOsType,
    EOvhProjectStatus,
    EOvhRegionStatus,
} from './ovh.interface';
import { ConnectorOvhService } from './ovh.service';
import {
    schemaConfig,
    schemaCredential,
} from './ovh.validation';
import {
    OvhInstallFactory,
    OvhUninstallFactory,
} from './tasks';
import type {
    IConnectorOvhConfig,
    IConnectorOvhCredential,
} from './ovh.interface';
import type {
    IOvhInstallCommandData,
    IOvhUninstallCommandData,
} from './tasks';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorData,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IFingerprintOptions,
    IOvhFlavorView,
    IOvhProjectView,
    IOvhQueryFlavors,
    IOvhQueryRegions,
    IOvhQuerySnapshots,
    IOvhRegionView,
    IOvhSnapshotView,
    ITaskToCreate,
} from '@scrapoxy/common';


const FLAVOR_TYPES = [
    'ovh.d2',
];


@Injectable()
export class ConnectorOvhFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_OVH_TYPE;

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
            OvhInstallFactory.type,
            new OvhInstallFactory(this.agents)
        );

        tasks.register(
            OvhUninstallFactory.type,
            new OvhUninstallFactory(this.agents)
        );
    }

    onModuleDestroy() {
        this.agents.close();
    }


    async validateCredentialConfig(config: IConnectorOvhCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new OvhApi(
                config.appKey,
                config.appSecret,
                config.consumerKey,
                this.agents
            );

            await api.getAllProjectsIds();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorOvhCredential,
        connectorConfig: IConnectorOvhConfig
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
        const service = new ConnectorOvhService(
            connector.credentialConfig,
            connector.connectorConfig,
            connector.certificate as ICertificate,
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
            connectorConfig = connector.config as IConnectorOvhConfig,
            credentialConfig = credential.config as IConnectorOvhCredential;
        const data: IOvhInstallCommandData = {
            ...credentialConfig,
            projectId: connectorConfig.projectId,
            region: connectorConfig.region,
            flavorId: connectorConfig.flavorId,
            hostname: void 0,
            port: connectorConfig.port,
            certificate,
            installInstanceId: void 0,
            snapshotName: void 0,
            snapshotId: void 0,
            fingerprintOptions,
            installId,
        };
        const taskToCreate: ITaskToCreate = {
            type: OvhInstallFactory.type,
            name: `Install OVH on connector ${connector.name} in region ${connectorConfig.region}`,
            stepMax: OvhInstallFactory.stepMax,
            message: 'Installing OVH connector...',
            data,
        };

        return taskToCreate;
    }

    async buildUninstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<ITaskToCreate> {
        const
            connectorConfig = connector.config as IConnectorOvhConfig,
            credentialConfig = credential.config as IConnectorOvhCredential;
        const data: IOvhUninstallCommandData = {
            ...credentialConfig,
            projectId: connectorConfig.projectId,
            region: connectorConfig.region,
            snapshotId: connectorConfig.snapshotId,
        };
        const taskToCreate: ITaskToCreate = {
            type: OvhUninstallFactory.type,
            name: `Uninstall OVH on connector ${connector.name} in region ${connectorConfig.region}`,
            stepMax: OvhUninstallFactory.stepMax,
            message: 'Uninstalling OVH connector...',
            data,
        };

        return taskToCreate;
    }

    async validateInstallCommand(
        credential: ICredentialData, connector: IConnectorData
    ): Promise<void> {
        const
            connectorConfig = connector.config as IConnectorOvhConfig,
            credentialConfig = credential.config as IConnectorOvhCredential;
        const api = new OvhApi(
            credentialConfig.appKey,
            credentialConfig.appSecret,
            credentialConfig.consumerKey,
            this.agents
        );

        // Check Snapshot
        if (!connectorConfig.snapshotId || connectorConfig.snapshotId.length <= 0) {
            throw new ConnectorInvalidError('Snapshot ID cannot be empty');
        }

        try {
            await api.getSnapshot(
                connectorConfig.projectId,
                connectorConfig.snapshotId
            );
        } catch (err: any) {
            throw new ConnectorInvalidError('Cannot find snapshot');
        }
    }

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorOvhCredential;

        switch (query.type) {
            case EOvhQueryCredential.Projects: {
                return this.queryProjects(credentialConfig);
            }

            case EOvhQueryCredential.Regions: {
                return this.queryRegions(
                    credentialConfig,
                    query.parameters as IOvhQueryRegions
                );
            }

            case EOvhQueryCredential.Flavors: {
                return this.queryFlavors(
                    credentialConfig,
                    query.parameters as IOvhQueryFlavors
                );
            }

            case EOvhQueryCredential.Snapshots: {
                return this.querySnapshots(
                    credentialConfig,
                    query.parameters as IOvhQuerySnapshots
                );
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    private async queryProjects(credentialConfig: IConnectorOvhCredential): Promise<IOvhProjectView[]> {
        const api = new OvhApi(
            credentialConfig.appKey,
            credentialConfig.appSecret,
            credentialConfig.consumerKey,
            this.agents
        );
        const projectsIds = await api.getAllProjectsIds();
        const projects = await Promise.all(projectsIds.map((projectId)=> api.getProject(projectId)));

        return projects
            .filter((p) => p.status === EOvhProjectStatus.Ok)
            .map(toOvhProjectView);
    }

    private async queryRegions(
        credentialConfig: IConnectorOvhCredential,
        parameters: IOvhQueryRegions
    ): Promise<IOvhRegionView[]> {
        const api = new OvhApi(
            credentialConfig.appKey,
            credentialConfig.appSecret,
            credentialConfig.consumerKey,
            this.agents
        );
        const regionsIds = await api.getAllRegionsIds(parameters.projectId);
        const regions = await Promise.all(regionsIds.map((regionId)=> api.getRegion(
            parameters.projectId,
            regionId
        )));

        return regions
            .filter((r) =>
                r.status === EOvhRegionStatus.UP &&
                r.services.findIndex((s) => s.name === 'instance') >= 0)
            .map(toOvhRegionView);
    }

    private async queryFlavors(
        credentialConfig: IConnectorOvhCredential,
        parameters: IOvhQueryFlavors
    ): Promise<IOvhFlavorView[]> {
        const api = new OvhApi(
            credentialConfig.appKey,
            credentialConfig.appSecret,
            credentialConfig.consumerKey,
            this.agents
        );
        const flavors = await api.getAllFlavors(
            parameters.projectId,
            parameters.region
        );

        return flavors
            .filter((f) => FLAVOR_TYPES.includes(f.type) && f.osType === EOvhFlavorOsType.linux)
            .map(toOvhFlavorView);
    }

    private async querySnapshots(
        credentialConfig: IConnectorOvhCredential,
        parameters: IOvhQuerySnapshots
    ): Promise<IOvhSnapshotView[]> {
        const api = new OvhApi(
            credentialConfig.appKey,
            credentialConfig.appSecret,
            credentialConfig.consumerKey,
            this.agents
        );
        const snapshots = await api.getAllSnapshots(
            parameters.projectId,
            parameters.region
        );

        return snapshots.map(toOvhSnapshotView);
    }
}
