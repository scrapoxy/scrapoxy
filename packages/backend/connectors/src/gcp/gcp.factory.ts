import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_GCP_TYPE,
    EGcpQueryCredential,
    GCP_DEFAULT_ZONE,
} from '@scrapoxy/common';
import { GcpApi } from './api';
import { ConnectorGcpService } from './gcp.service';
import {
    schemaConfig,
    schemaCredential,
} from './gcp.validation';
import type {
    IConnectorGcpConfig,
    IConnectorGcpCredential,
} from './gcp.interface';
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
    IGcpQueryMachineTypes,
    ITaskToCreate,
} from '@scrapoxy/common';


const FILTER_MACHINE_TYPES = [
    'n1-standard-1',
    'n1-standard-2',
    'n2-standard-2',
    'g1-small',
    'f1-micro',
];


@Injectable()
export class ConnectorGcpFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_GCP_TYPE;

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


    async validateCredentialConfig(config: IConnectorGcpCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new GcpApi(
                config.projectId,
                config.clientEmail,
                config.privateKeyId,
                config.privateKey,
                this.agents
            );

            await api.listInstances(
                GCP_DEFAULT_ZONE,
                'unknownlabel'
            );
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorGcpCredential,
        connectorConfig: IConnectorGcpConfig
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
        const service = new ConnectorGcpService(
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
        credential: ICredentialData, connector: IConnectorData
    ): Promise<void> {
        const
            connectorConfig = connector.config as IConnectorGcpConfig,
            credentialConfig = credential.config as IConnectorGcpCredential;
        const api = new GcpApi(
            credentialConfig.projectId,
            credentialConfig.clientEmail,
            credentialConfig.privateKeyId,
            credentialConfig.privateKey,
            this.agents
        );

        // Create firewall
        try {
            await api.getFirewall(connectorConfig.firewallName);
        } catch (err: any) {
            // Firewall not found
            try {
                await api.insertFirewall({
                    firewallName: connectorConfig.firewallName,
                    networkName: connectorConfig.networkName,
                    allowed: [
                        {
                            IPProtocol: 'tcp',
                            ports: [
                                connectorConfig.port.toString(10),
                            ],
                        },
                    ],
                    priority: 1000,
                });
            } catch (err2: any) {
                throw new ConnectorInvalidError(err2.message);
            }
        }
    }

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorGcpCredential;

        switch (query.type) {
            case EGcpQueryCredential.Zones: {
                return this.queryZones(credentialConfig);
            }

            case EGcpQueryCredential.MachineTypes: {
                return this.queryMachineTypes(
                    credentialConfig,
                    query.parameters as IGcpQueryMachineTypes
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryZones(credentialConfig: IConnectorGcpCredential): Promise<string[]> {
        const api = new GcpApi(
            credentialConfig.projectId,
            credentialConfig.clientEmail,
            credentialConfig.privateKeyId,
            credentialConfig.privateKey,
            this.agents
        );
        const zones = await api.listZones();

        return zones
            .map((z)=> z.name);
    }

    private async queryMachineTypes(
        credentialConfig: IConnectorGcpCredential,
        parameters: IGcpQueryMachineTypes
    ): Promise<string[]> {
        const api = new GcpApi(
            credentialConfig.projectId,
            credentialConfig.clientEmail,
            credentialConfig.privateKeyId,
            credentialConfig.privateKey,
            this.agents
        );
        const machineTypes = await api.listMachineTypes(
            parameters.zone,
            FILTER_MACHINE_TYPES
        );

        return machineTypes.map((z)=> z.name);
    }
}
