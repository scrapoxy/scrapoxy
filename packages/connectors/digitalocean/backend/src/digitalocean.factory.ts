import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorCertificateNotFoundError,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    TasksService,
    TRANSPORT_DATACENTER_TYPE,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_DIGITALOCEAN_TYPE,
    EDigitalOceanQueryCredential,
} from '@scrapoxy/connector-digitalocean-sdk';
import axios from 'axios';
import { DigitalOceanApi } from './api';
import {
    toDigitalOceanRegionView,
    toDigitalOceanSizeView,
    toDigitalOceanSnapshotView,
} from './digitalocean.helpers';
import { ConnectorDigitaloceanService } from './digitalocean.service';
import {
    schemaConfig,
    schemaCredential,
} from './digitalocean.validation';
import {
    DigitalInstallOceanFactory,
    DigitalUninstallOceanFactory,
} from './tasks';
import type {
    IConnectorDigitalOceanConfig,
    IConnectorDigitalOceanCredential,
} from './digitalocean.interface';
import type {
    IDigitalOceanInstallCommandData,
    IDigitalOceanUninstallCommandData,
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
    IConnectorListProxies,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ICredentialToCreateCallback,
    IFingerprintOptions,
    IOAuthToken,
    IProxyInfo,
    ITaskToCreate,
} from '@scrapoxy/common';
import type {
    IDigitalOceanQuerySizes,
    IDigitalOceanQuerySnapshots,
    IDigitalOceanRegionView,
    IDigitalOceanSizeView,
    IDigitalOceanSnapshotView,
} from '@scrapoxy/connector-digitalocean-sdk';


const FILTER_SIZES = [
    's-1vcpu-1gb', 's-1vcpu-2gb', 's-2vcpu-2gb',
];


@Injectable()
export class ConnectorDigitaloceanFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_DIGITALOCEAN_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_DATACENTER_TYPE,
        useCertificate: true,
    };

    private readonly agents = new Agents();

    constructor(
        connectorproviders: ConnectorprovidersService,
        tasks: TasksService
    ) {
        connectorproviders.register(this);

        tasks.register(
            DigitalInstallOceanFactory.type,
            new DigitalInstallOceanFactory(this.agents)
        );

        tasks.register(
            DigitalUninstallOceanFactory.type,
            new DigitalUninstallOceanFactory(this.agents)
        );
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorDigitalOceanCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new DigitalOceanApi(
                config.token,
                this.agents
            );

            await api.getAccount();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(credentialToCreate: ICredentialToCreateCallback): Promise<IConnectorDigitalOceanCredential> {
        const clientId = 'CLIENT_ID';
        const clientSecret = 'CLIENT_SECRET';
        const redirectUri = 'REDIRECT_URI';
        const res = await axios.post<IOAuthToken>(
            'https://cloud.digitalocean.com/v1/oauth/token',
            {},
            {
                params: {
                    grant_type: 'authorization_code',
                    code: credentialToCreate.config.code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                },
            }
        );
        const config: IConnectorDigitalOceanCredential = {
            token: res.data.access_token,
        };

        return config;
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorDigitalOceanCredential,
        connectorConfig: IConnectorDigitalOceanConfig
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
        const service = new ConnectorDigitaloceanService(
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
            connectorConfig = connector.config as IConnectorDigitalOceanConfig,
            credentialConfig = credential.config as IConnectorDigitalOceanCredential;
        const data: IDigitalOceanInstallCommandData = {
            token: credentialConfig.token,
            region: connectorConfig.region,
            hostname: void 0,
            port: connectorConfig.port,
            certificate,
            dropletId: void 0,
            powerOffActionId: void 0,
            snapshotActionId: void 0,
            fingerprintOptions,
            installId,
        };
        const taskToCreate: ITaskToCreate = {
            type: DigitalInstallOceanFactory.type,
            stepMax: DigitalInstallOceanFactory.stepMax,
            message: 'Installing DigitalOcean connector...',
            data,
        };

        return taskToCreate;
    }

    async buildUninstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<ITaskToCreate> {
        const
            connectorConfig = connector.config as IConnectorDigitalOceanConfig,
            credentialConfig = credential.config as IConnectorDigitalOceanCredential;
        const data: IDigitalOceanUninstallCommandData = {
            token: credentialConfig.token,
            snapshotId: connectorConfig.snapshotId,
        };
        const taskToCreate: ITaskToCreate = {
            type: DigitalUninstallOceanFactory.type,
            stepMax: DigitalUninstallOceanFactory.stepMax,
            message: 'Uninstalling Digital Ocean connector...',
            data,
        };

        return taskToCreate;
    }

    async validateInstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<void> {
        const
            connectorConfig = connector.config as IConnectorDigitalOceanConfig,
            credentialConfig = credential.config as IConnectorDigitalOceanCredential;
        const api = new DigitalOceanApi(
            credentialConfig.token,
            this.agents
        );

        if (!connectorConfig.snapshotId || connectorConfig.snapshotId.length <= 0) {
            throw new ConnectorInvalidError('Cannot find snapshot');
        }

        let snapshotId: number;
        try {
            snapshotId = parseInt(connectorConfig.snapshotId);
        } catch (err: any) {
            throw new ConnectorInvalidError(`Cannot parse snapshot id ${connectorConfig.snapshotId}`);
        }

        try {
            await api.getSnapshot(snapshotId);
        } catch (err: any) {
            throw new ConnectorInvalidError(`Cannot find snapshot ${connectorConfig.snapshotId}`);
        }
    }

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorDigitalOceanCredential;

        switch (query.type) {
            case EDigitalOceanQueryCredential.Regions: {
                return this.queryRegions(credentialConfig);
            }

            case EDigitalOceanQueryCredential.Sizes: {
                return this.querySizes(
                    credentialConfig,
                    query.parameters as IDigitalOceanQuerySizes
                );
            }

            case EDigitalOceanQueryCredential.Snapshots: {
                return this.querySnapshots(
                    credentialConfig,
                    query.parameters as IDigitalOceanQuerySnapshots
                );
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    async listAllProxies(credentialConfig: IConnectorDigitalOceanCredential): Promise<IConnectorListProxies> {
        const
            api = new DigitalOceanApi(
                credentialConfig.token,
                this.agents
            ),
            response: IConnectorListProxies = {
                proxies: [],
                errors: [],
            };

        try {
            const droplets = await api.getAllDroplets();
            for (const droplet of droplets) {
                const proxy: IProxyInfo = {
                    key: droplet.id.toString(10),
                    description: `name=${droplet.name} / region=${droplet.region.name}`,
                };
                response.proxies.push(proxy);
            }
        } catch (err: any) {
            response.errors.push(err.message);
        }

        return response;
    }

    private async queryRegions(credentialConfig: IConnectorDigitalOceanCredential): Promise<IDigitalOceanRegionView[]> {
        const api = new DigitalOceanApi(
            credentialConfig.token,
            this.agents
        );
        const regions = await api.getAllRegions();

        return regions
            .filter((r) => r.available)
            .map(toDigitalOceanRegionView);
    }

    private async querySizes(
        credentialConfig: IConnectorDigitalOceanCredential,
        parameters: IDigitalOceanQuerySizes
    ): Promise<IDigitalOceanSizeView[]> {
        const api = new DigitalOceanApi(
            credentialConfig.token,
            this.agents
        );
        const sizes = await api.getAllSizes();

        return sizes
            .filter((s) =>
                s.available &&
                FILTER_SIZES.includes(s.slug) &&
                s.regions.includes(parameters.region))
            .map(toDigitalOceanSizeView);
    }

    private async querySnapshots(
        credentialConfig: IConnectorDigitalOceanCredential,
        parameters: IDigitalOceanQuerySnapshots
    ): Promise<IDigitalOceanSnapshotView[]> {
        const api = new DigitalOceanApi(
            credentialConfig.token,
            this.agents
        );
        const snapshots = await api.getAllSnapshots();

        return snapshots
            .filter((s) => s.regions.includes(parameters.region))
            .map(toDigitalOceanSnapshotView);
    }
}
