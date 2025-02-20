import { Logger } from '@nestjs/common';
import {
    Agents,
    ScriptBuilder,
    TRANSPORT_DATACENTER_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_AZURE_TYPE,
    EProxyStatus,
    randomName,
    randomNames,
} from '@scrapoxy/common';
import { AzureApi } from './api';
import { convertRegionToCountryCode } from './azure.helpers';
import { EAzureDeploymentMode } from './azure.interface';
import { AzureResourceGroupState } from './state';
import { AzureVmsTemplateBuilder } from './template';
import type {
    IConnectorAzureConfig,
    IConnectorAzureCredential,
} from './azure.interface';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigDatacenter,
} from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


const VMS_LIMIT_PER_REQUEST = 266;


export class ConnectorAzureService implements IConnectorService {
    private readonly logger = new Logger(ConnectorAzureService.name);

    private readonly api: AzureApi;

    constructor(
        private readonly credentialConfig: IConnectorAzureCredential,
        private readonly connectorConfig: IConnectorAzureConfig,
        private readonly certificate: ICertificate,
        agents: Agents
    ) {
        this.api = new AzureApi(
            credentialConfig.tenantId,
            credentialConfig.clientId,
            credentialConfig.secret,
            credentialConfig.subscriptionId,
            agents
        );
    }

    async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        let state: AzureResourceGroupState;
        try {
            state = await this.api.getResourceGroupState(
                this.connectorConfig.resourceGroupName,
                this.connectorConfig.prefix
            );
        } catch (err: any) {
            if (err.code === 'ResourceGroupNotFound') {
                return [];
            }

            throw err;
        }

        await this.api.cleanResourceGroupState(state);

        const vms = new Map<string, IConnectorProxyRefreshed>();

        // Deployed VMs
        for (const vm of state.virtualMachines) {
            const config: ITransportProxyRefreshedConfigDatacenter = {
                address: vm.hostname ? {
                    hostname: vm.hostname,
                    port: this.connectorConfig.port,
                } : void 0,
            };
            const proxy: IConnectorProxyRefreshed = {
                type: CONNECTOR_AZURE_TYPE,
                transportType: TRANSPORT_DATACENTER_TYPE,
                key: vm.id,
                name: vm.name,
                config,
                status: vm.status,
                removingForceCap: false,
                countryLike: convertRegionToCountryCode(this.connectorConfig.location),
            };

            vms.set(
                proxy.key,
                proxy
            );
        }

        // VM Deployment in progress
        for (const deploymentName of state.deploymentNames) {
            const key = `${this.connectorConfig.prefix}-${deploymentName}-vm`;

            if (!vms.has(key)) {
                const config: ITransportProxyRefreshedConfigDatacenter = {
                    address: void 0,
                };
                const proxy: IConnectorProxyRefreshed = {
                    type: CONNECTOR_AZURE_TYPE,
                    transportType: TRANSPORT_DATACENTER_TYPE,
                    key,
                    name: deploymentName,
                    config,
                    status: EProxyStatus.STARTING,
                    removingForceCap: false,
                    countryLike: convertRegionToCountryCode(this.connectorConfig.location),
                };

                vms.set(
                    proxy.key,
                    proxy
                );
            }
        }

        return Array.from(vms.values());
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        let architecture: string,
            sku: string;

        if (this.connectorConfig.vmSize.startsWith('Standard_A1')) {
            sku = 'server-gen1';
            architecture = 'amd64';
        } else if (this.connectorConfig.vmSize.startsWith('Standard_D2pl')) {
            sku = 'server-arm64';
            architecture = 'arm64';
        } else {
            sku = 'server';
            architecture = 'amd64';
        }

        const runScript = await new ScriptBuilder(
            this.connectorConfig.port,
            this.certificate,
            architecture
        )
            .build();
        const namesLimit = randomNames(Math.min(
            count,
            VMS_LIMIT_PER_REQUEST
        ));
        const template = new AzureVmsTemplateBuilder(
            this.connectorConfig.prefix,
            this.connectorConfig.port
        )
            .addVms(
                namesLimit,
                {
                    publisher: 'canonical',
                    offer: 'ubuntu-24_04-lts',
                    sku,
                    version: 'latest',
                },
                runScript,
                this.connectorConfig.useSpotInstances
            )
            .build();

        await this.api.createDeployment(
            this.connectorConfig.resourceGroupName,
            `${this.connectorConfig.prefix}-deployment-${randomName()}`,
            {
                properties: {
                    mode: EAzureDeploymentMode.Incremental,
                    template,
                    parameters: {
                        subscriptionId: {
                            value: this.credentialConfig.subscriptionId,
                        },
                        location: {
                            value: this.connectorConfig.location,
                        },
                        vmSize: {
                            value: this.connectorConfig.vmSize,
                        },
                        storageAccountType: {
                            value: this.connectorConfig.storageAccountType,
                        },
                        vmNames: {
                            value: namesLimit,
                        },
                    },
                },
            }
        );

        return [];
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((key) => this.api.startVirtualMachine(
            this.connectorConfig.resourceGroupName,
            key
        )));
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((p) => this.api.deleteVirtualMachine(
            this.connectorConfig.resourceGroupName,
            p.key
        )));

        return [];
    }
}
