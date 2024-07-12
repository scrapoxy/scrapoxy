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
    CONNECTOR_GCP_TYPE,
    EGcpQueryCredential,
    GCP_DEFAULT_ZONE,
} from '@scrapoxy/common';
import { GcpApi } from './api';
import { ConnectorGcpService } from './gcp.service';
import {
    schemaConfig,
    schemaCredential,
    schemaInstallConfig,
} from './gcp.validation';
import {
    GcpInstallFactory,
    GcpUninstallFactory,
} from './tasks';
import type {
    IConnectorGcpConfig,
    IConnectorGcpCredential,
    IConnectorGcpInstallConfig,
} from './gcp.interface';
import type {
    IGcpInstallCommandData,
    IGcpUninstallCommandData,
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
    IFingerprintOptions,
    IGcpQueryMachineTypes,
    IProxyInfo,
    ITaskToCreate,
} from '@scrapoxy/common';


const FILTER_MACHINE_TYPES = [
    'n1-standard-1', 'n1-standard-2', 'n2-standard-2',
];


@Injectable()
export class ConnectorGcpFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_GCP_TYPE;

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
            GcpInstallFactory.type,
            new GcpInstallFactory(this.agents)
        );

        tasks.register(
            GcpUninstallFactory.type,
            new GcpUninstallFactory(this.agents)
        );
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

    async validateCredentialCallback(): Promise<IConnectorGcpCredential> {
        throw new Error('Not implemented');
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

    async validateInstallConfig(config: IConnectorGcpInstallConfig): Promise<void> {
        await validate(
            schemaInstallConfig,
            config
        );
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        const service = new ConnectorGcpService(
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
        fingerprintOptions: IFingerprintOptions,
        config: any
    ): Promise<ITaskToCreate> {
        if (!certificate) {
            throw new ConnectorCertificateNotFoundError(
                connector.projectId,
                connector.id
            );
        }

        const
            connectorConfig = connector.config as IConnectorGcpConfig,
            credentialConfig = credential.config as IConnectorGcpCredential,
            installConfig = config as IConnectorGcpInstallConfig;
        const data: IGcpInstallCommandData = {
            ...credentialConfig,
            zone: connectorConfig.zone,
            hostname: void 0,
            port: connectorConfig.port,
            certificate,
            machineType: connectorConfig.machineType,
            templateName: connectorConfig.templateName,
            networkName: connectorConfig.networkName,
            diskType: installConfig.diskType,
            diskSize: installConfig.diskSize,
            firewallName: connectorConfig.firewallName,
            insertFirewallOpId: void 0,
            insertInstanceOpId: void 0,
            stopInstanceOpId: void 0,
            deleteInstanceOpId: void 0,
            insertImageOp: void 0,
            insertTemplateOpId: void 0,
            fingerprintOptions,
            installId,
        };
        const taskToCreate: ITaskToCreate = {
            type: GcpInstallFactory.type,
            name: `Install GCP on connector ${connector.name} in zone ${connectorConfig.zone}`,
            stepMax: GcpInstallFactory.stepMax,
            message: 'Installing GCP connector...',
            data,
        };

        return taskToCreate;
    }

    async buildUninstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<ITaskToCreate> {
        const
            connectorConfig = connector.config as IConnectorGcpConfig,
            credentialConfig = credential.config as IConnectorGcpCredential;
        const data: IGcpUninstallCommandData = {
            ...credentialConfig,
            zone: connectorConfig.zone,
            templateName: connectorConfig.templateName,
            firewallName: connectorConfig.firewallName,
            deleteTemplateOpId: void 0,
            deleteImageOpId: void 0,
            deleteFirewallOpId: void 0,
        };
        const taskToCreate: ITaskToCreate = {
            type: GcpUninstallFactory.type,
            name: `Uninstall GCP on connector ${connector.name} in zone ${connectorConfig.zone}`,
            stepMax: GcpUninstallFactory.stepMax,
            message: 'Uninstalling GCP connector...',
            data,
        };

        return taskToCreate;
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

        // Check network
        try {
            await api.getNetwork(connectorConfig.networkName);
        } catch (err: any) {
            throw new ConnectorInvalidError(`Cannot find network ${connectorConfig.networkName}`);
        }

        // Check firewall
        try {
            await api.getFirewall(connectorConfig.firewallName);
        } catch (err: any) {
            throw new ConnectorInvalidError(`Cannot find firewall ${connectorConfig.firewallName}`);
        }

        // Check image
        const imageName = `${connectorConfig.templateName}-image`;
        try {
            await api.getImage(imageName);
        } catch (err: any) {
            throw new ConnectorInvalidError(`Cannot find image ${imageName}`);
        }

        // Check template
        try {
            await api.getTemplate(connectorConfig.templateName);
        } catch (err: any) {
            throw new ConnectorInvalidError(`Cannot find template ${connectorConfig.templateName}`);
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
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    async listAllProxies(credentialConfig: IConnectorGcpCredential): Promise<IConnectorListProxies> {
        const
            api = new GcpApi(
                credentialConfig.projectId,
                credentialConfig.clientEmail,
                credentialConfig.privateKeyId,
                credentialConfig.privateKey,
                this.agents
            ),
            response: IConnectorListProxies = {
                proxies: [],
                errors: [],
            };

        try {
            const
                promises: Promise<void>[] = [],
                zones = await api.listZones();
            for (const zone of zones) {
                const promise = (async() => {
                    try {
                        const instances = await api.listInstances(zone.name);

                        for (const instance of instances) {
                            const proxy: IProxyInfo = {
                                key: instance.name,
                                description: `zone=${zone.name}`,
                            };
                            response.proxies.push(proxy);
                        }
                    } catch (err: any) {
                        response.errors.push(err.message);
                    }
                })();

                promises.push(promise);
            }

            await Promise.all(promises);
        } catch (err: any) {
            response.errors.push(err.message);
        }

        return response;
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
