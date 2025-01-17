import {
    Agents,
    fingerprint,
    InstallScriptBuilder,
    TaskStepError,
    TRANSPORT_DATACENTER_TYPE,
    TransportDatacenterServiceImpl,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    CONNECTOR_GCP_TYPE,
    EFingerprintMode,
    formatProxyId,
    generateUseragent,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
} from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import * as Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { GcpApi } from '../api';
import { getGcpExternalIp } from '../gcp.helpers';
import { EGcpOperationStatus } from '../gcp.interface';
import { schemaCredential } from '../gcp.validation';
import type { IConnectorGcpCredential } from '../gcp.interface';
import type { IProxyToConnectConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IFingerprintOptions,
    IFingerprintRequest,
    IProxyToRefresh,
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IGcpInstallCommandData extends IConnectorGcpCredential{
    zone: string;
    hostname: string | undefined;
    port: number;
    certificate: ICertificate;
    machineType: string;
    templateName: string;
    networkName: string;
    diskType: string;
    diskSize: number;
    firewallName: string;
    insertFirewallOpId: string | undefined;
    insertInstanceOpId: string | undefined;
    stopInstanceOpId: string | undefined;
    deleteInstanceOpId: string | undefined;
    insertImageOp: string | undefined;
    insertTemplateOpId: string | undefined;
    fingerprintOptions: IFingerprintOptions;
    installId: string;
}


const schemaData = schemaCredential.keys({
    zone: Joi.string()
        .required(),
    hostname: Joi.string()
        .optional(),
    port: Joi.number()
        .required(),
    certificate: Joi.object()
        .required(),
    machineType: Joi.string()
        .required(),
    templateName: Joi.string()
        .required(),
    networkName: Joi.string()
        .required(),
    diskType: Joi.string()
        .required(),
    diskSize: Joi.number()
        .required(),
    firewallName: Joi.string()
        .required(),
    insertFirewallOpId: Joi.string()
        .optional(),
    insertInstanceOpId: Joi.string()
        .optional(),
    stopInstanceOpId: Joi.string()
        .optional(),
    deleteInstanceOpId: Joi.string()
        .optional(),
    insertImageOp: Joi.string()
        .optional(),
    insertTemplateOpId: Joi.string()
        .optional(),
    fingerprintOptions: Joi.object()
        .required(),
    installId: Joi.string()
        .required(),
});


class GcpInstallCommand extends ATaskCommand {
    private readonly data: IGcpInstallCommandData;

    private readonly transport = new TransportDatacenterServiceImpl();

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IGcpInstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new GcpApi(
            this.data.projectId,
            this.data.clientEmail,
            this.data.privateKeyId,
            this.data.privateKey,
            this.agents
        );
        switch (this.task.stepCurrent) {
            case 0: {
                // Create firewall
                try {
                    await api.getFirewall(this.data.firewallName);

                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip firewall ${this.data.firewallName} creation...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                } catch (err: any) {
                    // Firewall not found
                    const insertFirewallOp = await api.insertFirewall({
                        firewallName: this.data.firewallName,
                        networkName: this.data.networkName,
                        allowed: [
                            {
                                IPProtocol: 'tcp',
                                ports: [
                                    this.data.port.toString(10),
                                ],
                            },
                        ],
                        priority: 1000,
                    });
                    this.data.insertFirewallOpId = insertFirewallOp.id;

                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Creating firewall ${this.data.firewallName}...`,
                        nextRetryTs: Date.now() + 4000,
                        data: this.data,
                    };

                    return taskToUpdate;
                }
            }

            case 1: {
                // Wait firewall to be created (only if doesn't exist)
                if (this.data.insertFirewallOpId) {
                    const insertFirewallOp = await api.getGlobalOperation(this.data.insertFirewallOpId as string);

                    if (insertFirewallOp.status !== EGcpOperationStatus.DONE) {
                        return this.waitTask();
                    }
                }

                // Create install instance
                const startupScript = await new InstallScriptBuilder(
                    this.data.port,
                    this.data.certificate
                )
                    .build();
                const instanceName = `${this.data.templateName}-instance`;
                const insertInstanceOp = await api.insertInstance({
                    diskName: `${this.data.templateName}-disk`,
                    diskSizeGb: this.data.diskSize.toString(10),
                    diskType: this.data.diskType,
                    instanceName,
                    machineType: this.data.machineType,
                    networkName: this.data.networkName,
                    startupScript,
                    sourceImage: 'projects/debian-cloud/global/images/family/debian-12',
                    zone: this.data.zone,
                });

                this.data.insertInstanceOpId = insertInstanceOp.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating instance ${instanceName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 2: {
                // Wait instance to be created
                const insertInstanceOp = await api.getOperation(
                    this.data.zone,
                    this.data.insertInstanceOpId as string
                );

                if (insertInstanceOp.status !== EGcpOperationStatus.DONE) {
                    return this.waitTask();
                }

                const instanceName = `${this.data.templateName}-instance`;
                const instance = await api.getInstance(
                    this.data.zone,
                    instanceName
                );
                this.data.hostname = getGcpExternalIp(instance);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Fingerprinting instance ${instanceName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 3: {
                // Wait for a reachable instance
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
                    type: CONNECTOR_GCP_TYPE,
                    transportType: TRANSPORT_DATACENTER_TYPE,
                    connectorId: this.task.connectorId,
                    projectId: this.task.projectId,
                    key,
                    config,
                    useragent: generateUseragent(),
                    timeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
                    ciphers: null,
                    bytesReceived: 0,
                    bytesSent: 0,
                    requests: 0,
                    requestsValid: 0,
                    requestsInvalid: 0,
                    countryLike: null,
                };
                const sockets = new Sockets();
                try {
                    const fpRequest: IFingerprintRequest = {
                        installId: this.data.installId,
                        mode: EFingerprintMode.INSTALL,
                        connectorType: proxy.type,
                        proxyId: proxy.id,
                    };

                    await fingerprint(
                        this.transport,
                        proxy,
                        this.data.fingerprintOptions,
                        fpRequest,
                        sockets
                    );
                } catch (err: any) {
                    return this.waitTask();
                } finally {
                    sockets.closeAll();
                }

                // Stop the instance
                const instanceName = `${this.data.templateName}-instance`;
                const stopInstanceOp = await api.stopInstance(
                    this.data.zone,
                    instanceName
                );
                this.data.stopInstanceOpId = stopInstanceOp.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Stopping instance ${instanceName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 4: {
                // Wait instance to be stopped
                const stopInstanceOp = await api.getOperation(
                    this.data.zone,
                    this.data.stopInstanceOpId as string
                );

                if (stopInstanceOp.status !== EGcpOperationStatus.DONE) {
                    return this.waitTask();
                }

                // Create image
                const
                    diskName = `${this.data.templateName}-disk`,
                    imageName = `${this.data.templateName}-image`;
                const insertImageOp = await api.insertImage({
                    zone: this.data.zone,
                    imageName,
                    diskName,
                });

                this.data.insertImageOp = insertImageOp.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating image ${imageName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 5: {
                // Wait image to be created
                const insertImageOp = await api.getGlobalOperation(this.data.insertImageOp as string);

                if (insertImageOp.status !== EGcpOperationStatus.DONE) {
                    return this.waitTask();
                }

                // Create template
                const sourceImage = `${this.data.templateName}-image`;
                const insertTemplateOp = await api.insertTemplate({
                    templateName: this.data.templateName,
                    sourceImage,
                    machineType: this.data.machineType,
                    diskType: this.data.diskType,
                    diskSizeGb: this.data.diskSize.toString(10),
                    networkName: this.data.networkName,
                });

                this.data.insertTemplateOpId = insertTemplateOp.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating template ${this.data.templateName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 6: {
                // Wait template to be created
                const insertTemplateOp = await api.getGlobalOperation(this.data.insertTemplateOpId as string);

                if (insertTemplateOp.status !== EGcpOperationStatus.DONE) {
                    return this.waitTask();
                }

                // Remove instance
                const instanceName = `${this.data.templateName}-instance`;
                const deleteInstanceOp = await api.deleteInstance(
                    this.data.zone,
                    instanceName
                );
                this.data.deleteInstanceOpId = deleteInstanceOp.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Remove instance ${instanceName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 7: {
                // Wait instance to be deleted
                const deleteInstanceOp = await api.getOperation(
                    this.data.zone,
                    this.data.deleteInstanceOpId as string
                );

                if (deleteInstanceOp.status !== EGcpOperationStatus.DONE) {
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
        const api = new GcpApi(
            this.data.projectId,
            this.data.clientEmail,
            this.data.privateKeyId,
            this.data.privateKey,
            this.agents
        );

        // Remove instance
        try {
            const instanceName = `${this.data.templateName}-instance`;

            await api.getInstance(
                this.data.zone,
                instanceName
            );

            const deleteInstanceOp = await api.deleteInstance(
                this.data.zone,
                instanceName
            );

            this.data.deleteInstanceOpId = deleteInstanceOp.id;
        } catch (err: any) {
            // Instance doesn't exist
        }
    }
}


export class GcpInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_GCP_TYPE}`;

    static readonly stepMax = 8;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new GcpInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IGcpInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
