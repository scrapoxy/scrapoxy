import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_AZURE_TYPE,
    randomName,
    randomNames,
    safeJoin,
} from '@scrapoxy/common';
import { AzureApi } from './api';
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

        return state.virtualMachines.map((vm) => {
            const config: ITransportProxyRefreshedConfigDatacenter = {
                address: vm.hostname ? {
                    hostname: vm.hostname,
                    port: this.connectorConfig.port,
                } : void 0,
            };
            const proxy: IConnectorProxyRefreshed = {
                type: CONNECTOR_AZURE_TYPE,
                key: vm.id,
                name: vm.name,
                config,
                status: vm.status,
            };

            return proxy;
        });
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const namesLimit = randomNames(Math.min(
            count,
            VMS_LIMIT_PER_REQUEST
        ));
        const template = new AzureVmsTemplateBuilder(
            this.connectorConfig.prefix,
            this.connectorConfig.port
        )
            .addVms(namesLimit)
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
                        imageResourceGroupName: {
                            value: this.connectorConfig.imageResourceGroupName,
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
                    },
                },
            }
        );

        return [];
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        await Promise.all(keys.map((key) => this.api.startVirtualMachine(
            this.connectorConfig.resourceGroupName,
            key
        )));
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

        await Promise.all(proxiesKeys.map((key) => this.api.deleteVirtualMachine(
            this.connectorConfig.resourceGroupName,
            key
        )));

        return [];
    }
}
