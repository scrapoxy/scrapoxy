import {
    ATaskCommand,
    CONNECTOR_AZURE_TYPE,
    EFingerprintMode,
    EProxyStatus,
    formatProxyId,
    generateUseragent,
    randomName,
    SCRAPOXY_DATACENTER_PREFIX,
} from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import * as Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { TaskStepError } from '../../../errors';
import { fingerprint } from '../../../fingerprint';
import {
    Agents,
    InstallScriptBuilder,
    validate,
} from '../../../helpers';
import { TransportDatacenterServiceImpl } from '../../../transports';
import { AzureApi } from '../api';
import {
    convertAzureStateToProxyStatus,
    getAzureErrorMessage,
} from '../azure.helpers';
import {
    EAzureDeploymentMode,
    EAzureProvisioningState,
} from '../azure.interface';
import { schemaCredential } from '../azure.validation';
import {
    AzureImageTemplateBuilder,
    AzureVmsTemplateBuilder,
} from '../template';
import type { IProxyToConnectConfigDatacenter } from '../../../transports';
import type { IConnectorAzureCredential } from '../azure.interface';
import type {
    ICertificate,
    IFingerprintOptions,
    IFingerprintRequest,
    IProxyToRefresh,
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IAzureInstallCommandData extends IConnectorAzureCredential {
    location: string;
    hostname: string | undefined;
    port: number;
    certificate: ICertificate;
    resourceGroupName: string;
    vmName: string;
    vmSize: string;
    storageAccountType: string;
    vmDeploymentName: string | undefined;
    prefix: string;
    imageResourceGroupName: string;
    imageDeploymentName: string | undefined;
    fingerprintOptions: IFingerprintOptions;
    installId: string;
}


const schemaData = schemaCredential.keys({
    location: Joi.string()
        .required(),
    hostname: Joi.string()
        .optional(),
    port: Joi.number()
        .required(),
    certificate: Joi.object()
        .required(),
    resourceGroupName: Joi.string()
        .required(),
    vmName: Joi.string()
        .required(),
    vmSize: Joi.string()
        .required(),
    storageAccountType: Joi.string()
        .required(),
    vmDeploymentName: Joi.string()
        .optional(),
    prefix: Joi.string()
        .required(),
    imageResourceGroupName: Joi.string()
        .required(),
    imageDeploymentName: Joi.string()
        .optional(),
    fingerprintOptions: Joi.object()
        .required(),
    installId: Joi.string()
        .required(),
});


class AzureInstallCommand extends ATaskCommand {
    private readonly data: IAzureInstallCommandData;

    private readonly transport = new TransportDatacenterServiceImpl();

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IAzureInstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new AzureApi(
            this.data.tenantId,
            this.data.clientId,
            this.data.secret,
            this.data.subscriptionId,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                // Create all resource groups
                await Promise.all([
                    api.createResourceGroup(
                        this.data.resourceGroupName,
                        this.data.location
                    ),
                    api.createResourceGroup(
                        this.data.imageResourceGroupName,
                        this.data.location
                    ),
                ]);

                // Create VM reference
                const installScript = await new InstallScriptBuilder(this.data.certificate)
                    .build();
                const template = new AzureVmsTemplateBuilder(
                    `${this.data.prefix}img`,
                    this.data.port
                )
                    .addVmReference(
                        this.data.vmName,
                        {
                            publisher: 'canonical',
                            offer: '0001-com-ubuntu-server-focal',
                            sku: '20_04-lts-gen2',
                            version: 'latest',
                        },
                        installScript
                    )
                    .build();
                const vmDeployment = await api.createDeployment(
                    this.data.imageResourceGroupName,
                    `deployment-${randomName()}`,
                    {
                        properties: {
                            mode: EAzureDeploymentMode.Incremental,
                            template,
                            parameters: {
                                location: {
                                    value: this.data.location,
                                },
                                vmSize: {
                                    value: this.data.vmSize,
                                },
                                storageAccountType: {
                                    value: this.data.storageAccountType,
                                },
                            },
                        },
                    }
                );

                this.data.vmDeploymentName = vmDeployment.name;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating VM ${this.data.vmName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait VM deployment to finish
                const deployment = await api.getDeployment(
                    this.data.imageResourceGroupName,
                    this.data.vmDeploymentName as string
                );

                switch (deployment.properties.provisioningState) {
                    case EAzureProvisioningState.Running:
                    case EAzureProvisioningState.Accepted: {
                        return this.waitTask();
                    }

                    case EAzureProvisioningState.Succeeded: {
                        break;
                    }

                    default: {
                        throw new TaskStepError(
                            this.task.stepCurrent,
                            getAzureErrorMessage(deployment.properties.error) ?? 'Error in creating virtual machine'
                        );
                    }
                }

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Starting VM ${this.data.vmName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 2: {
                // Wait for a started VM
                const state = await api.getResourceGroupState(
                    this.data.imageResourceGroupName,
                    `${this.data.prefix}img`
                );

                if (state.virtualMachines.length <= 0) {
                    return this.waitTask();
                }

                const vm = state.virtualMachines[ 0 ];

                if (vm.status !== EProxyStatus.STARTED && !vm.hostname) {
                    return this.waitTask();
                }

                this.data.hostname = vm.hostname as string;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Fingerprinting VM ${this.data.vmName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 3: {
                // Wait for a reachable VM
                const config: IProxyToConnectConfigDatacenter = {
                    address: {
                        hostname: this.data.hostname as string,
                        port: this.data.port,
                    },
                    certificate: this.data.certificate,
                };
                const key = uuid();
                const proxy: IProxyToRefresh = {
                    id: formatProxyId(
                        this.task.connectorId,
                        key
                    ),
                    type: CONNECTOR_AZURE_TYPE,
                    connectorId: this.task.connectorId,
                    projectId: this.task.projectId,
                    key,
                    config,
                    useragent: generateUseragent(),
                    bytesReceived: 0,
                    bytesSent: 0,
                    requests: 0,
                };
                const sockets = new Sockets();
                try {
                    const payload: IFingerprintRequest = {
                        installId: this.data.installId,
                        mode: EFingerprintMode.INSTALL,
                        connectorType: proxy.type,
                        proxyId: proxy.id,
                    };

                    await fingerprint(
                        this.transport,
                        proxy,
                        this.data.fingerprintOptions,
                        payload,
                        sockets
                    );
                } catch (err: any) {
                    return this.waitTask();
                } finally {
                    sockets.closeAll();
                }

                // Stop the VM
                await api.powerOffVirtualMachine(
                    this.data.imageResourceGroupName,
                    `${this.data.prefix}img-${this.data.vmName}-vm`
                );

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Stopping VM ${this.data.vmName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 4: {
                // Wait stop VM finish
                const instanceView = await api.getVirtualMachineInstanceView(
                    this.data.imageResourceGroupName,
                    `${this.data.prefix}img-${this.data.vmName}-vm`
                );
                const status = convertAzureStateToProxyStatus(instanceView);

                if (status !== EProxyStatus.STOPPED) {
                    return this.waitTask();
                }

                // Create a snapshot
                const template = new AzureImageTemplateBuilder(`${this.data.prefix}img`)
                    .build();
                const imageDeployment = await api.createDeployment(
                    this.data.imageResourceGroupName,
                    `${this.data.prefix}img-deployment-${randomName()}`,
                    {
                        properties: {
                            mode: EAzureDeploymentMode.Incremental,
                            template,
                            parameters: {
                                subscriptionId: {
                                    value: this.data.subscriptionId,
                                },
                                imageResourceGroupName: {
                                    value: this.data.imageResourceGroupName,
                                },
                                location: {
                                    value: this.data.location,
                                },
                                galleryName: {
                                    value: SCRAPOXY_DATACENTER_PREFIX,
                                },
                                storageAccountType: {
                                    value: this.data.storageAccountType,
                                },
                                vmName: {
                                    value: this.data.vmName,
                                },
                            },
                        },
                    }
                );
                this.data.imageDeploymentName = imageDeployment.name;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Creating image...',
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 5: {
                // Wait image deployment to finish
                const deployment = await api.getDeployment(
                    this.data.imageResourceGroupName,
                    this.data.imageDeploymentName as string
                );

                switch (deployment.properties.provisioningState) {
                    case EAzureProvisioningState.Running:
                    case EAzureProvisioningState.Accepted: {
                        return this.waitTask();
                    }

                    case EAzureProvisioningState.Succeeded: {
                        break;
                    }

                    default: {
                        throw new TaskStepError(
                            this.task.stepCurrent,
                            getAzureErrorMessage(deployment.properties.error) ?? 'Error in creating image'
                        );
                    }
                }

                // Remove VM
                await api.deleteVirtualMachine(
                    this.data.imageResourceGroupName,
                    `${this.data.prefix}img-${this.data.vmName}-vm`
                );

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Remove VM ${this.data.vmName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 6: {
                // Wait removing all unused resources
                const state = await api.getResourceGroupState(
                    this.data.imageResourceGroupName,
                    `${this.data.prefix}img`
                );

                if (!state.empty) {
                    await api.cleanResourceGroupState(state);

                    return this.waitTask();
                }

                // No next step
                const taskToUpdate: ITaskToUpdate = {
                    running: false,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Connector installed.',
                    nextRetryTs: this.task.nextRetryTs,
                    data: this.data,
                };

                return taskToUpdate;
            }

            default: {
                throw new TaskStepError(
                    this.task.stepCurrent,
                    'Task step unknown'
                );
            }
        }
    }

    async cancel(): Promise<void> {
        const api = new AzureApi(
            this.data.tenantId,
            this.data.clientId,
            this.data.secret,
            this.data.subscriptionId,
            this.agents
        );

        if (this.data.vmDeploymentName) {
            const deployment = await api.getDeployment(
                this.data.imageResourceGroupName,
                this.data.vmDeploymentName as string
            );

            if ([
                EAzureProvisioningState.Accepted, EAzureProvisioningState.Running,
            ].includes(deployment.properties.provisioningState)) {
                await api.cancelDeployment(
                    this.data.imageResourceGroupName,
                    this.data.vmDeploymentName as string
                );
            }
        }

        if (this.data.imageDeploymentName) {
            const deployment = await api.getDeployment(
                this.data.imageResourceGroupName,
                this.data.imageDeploymentName as string
            );

            if ([
                EAzureProvisioningState.Accepted, EAzureProvisioningState.Running,
            ].includes(deployment.properties.provisioningState)) {
                await api.cancelDeployment(
                    this.data.imageResourceGroupName,
                    this.data.imageDeploymentName as string
                );
            }
        }
    }
}


export class AzureInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_AZURE_TYPE}`;

    static readonly stepMax = 7;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new AzureInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IAzureInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
