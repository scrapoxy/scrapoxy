import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
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
import type {
    IConnectorOvhConfig,
    IConnectorOvhCredential,
} from './ovh.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IOvhFlavorView,
    IOvhProjectView,
    IOvhQueryFlavors,
    IOvhQueryRegions,
    IOvhRegionView,
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

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
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

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
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
}
