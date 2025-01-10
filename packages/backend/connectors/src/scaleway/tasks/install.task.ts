import {
    Agents,
    CommanderFrontendClient,
    fingerprint,
    InstallScriptBuilder,
    TaskStepError,
    TRANSPORT_DATACENTER_TYPE,
    TransportDatacenterServiceImpl,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    CONNECTOR_SCALEWAY_TYPE,
    EFingerprintMode,
    formatProxyId,
    generateUseragent,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
    randomName,
} from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import * as Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { ScalewayApi } from '../api';
import {
    EScalewayImageState,
    EScalewayInstanceState,
    EScalewaySnapshotState,
} from '../scaleway.interface';
import type { IConnectorScalewayConfig } from '../scaleway.interface';
import type { IProxyToConnectConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IFingerprintOptions,
    IFingerprintRequest,
    IProxyToRefresh,
    ITaskContext,
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IScalewayInstallCommandData {
    secretAccessKey: string;
    region: string;
    projectId: string;
    hostname: string | undefined;
    port: number;
    certificate: ICertificate;
    instanceId: string | undefined;
    instanceType: string;
    snapshotId: string | undefined;
    imageId: string | undefined;
    fingerprintOptions: IFingerprintOptions;
    installId: string;
}


const schemaData = Joi.object({
    secretAccessKey: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    projectId: Joi.string()
        .required(),
    hostname: Joi.string()
        .optional(),
    port: Joi.number()
        .required(),
    certificate: Joi.object()
        .required(),
    instanceId: Joi.string()
        .optional(),
    instanceType: Joi.string()
        .required(),
    snapshotId: Joi.string()
        .optional(),
    imageId: Joi.string()
        .optional(),
    fingerprintOptions: Joi.object()
        .required(),
    installId: Joi.string()
        .required(),
});


class ScalewayInstallCommand extends ATaskCommand {
    private readonly data: IScalewayInstallCommandData;

    private readonly transport = new TransportDatacenterServiceImpl();

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IScalewayInstallCommandData;
    }

    async execute(context: ITaskContext): Promise<ITaskToUpdate> {
        const api = new ScalewayApi(
            this.data.secretAccessKey,
            this.data.region,
            this.data.projectId,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                const instance = await api.createInstance({
                    name: randomName(),
                    project: this.data.projectId,
                    commercial_type: this.data.instanceType,
                    image: 'ubuntu_noble',
                    tags: [],
                });

                this.data.instanceId = instance.id;

                await api.attachIP(instance.id);

                const userData = await new InstallScriptBuilder(this.data.certificate)
                    .build();

                await api.setUserData(
                    instance.id,
                    userData
                );

                await api.startInstance(instance.id);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating instance ${this.data.instanceId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Start the instance
                const instance = await api.getInstance(this.data.instanceId as string);

                if (instance.state !== EScalewayInstanceState.RUNNING ||
                    !instance.public_ips ||
                    instance.public_ips.length <= 0 ||
                    !instance.public_ips[ 0 ].address) {

                    return this.waitTask();
                }

                this.data.hostname = instance.public_ips[ 0 ].address;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Fingerprinting instance ${this.data.instanceId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 2: {
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
                    type: CONNECTOR_SCALEWAY_TYPE,
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
                await api.stopInstance(this.data.instanceId as string);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Stopping instance ${this.data.instanceId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 3: {
                // Wait stop instance finish
                const instance = await api.getInstance(this.data.instanceId as string);

                if (instance.state !== EScalewayInstanceState.STOPPED) {
                    return this.waitTask();
                }

                // Create an snapshot
                const snapshotName = randomName();
                const snapshot = await api.createSnapshot(
                    instance.volumes[ 0 ].id,
                    snapshotName
                );

                this.data.snapshotId = snapshot.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating snapshot ${snapshotName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 4: {
                // Wait create snapshot to finish
                const snapshot = await api.getSnapshot(this.data.snapshotId as string);

                if (snapshot.state !== EScalewaySnapshotState.AVAILABLE) {
                    return this.waitTask();
                }

                const instance = await api.getInstance(this.data.instanceId as string);
                // Create an image
                const imageName = randomName();
                const image = await api.createImage(
                    imageName,
                    snapshot.id,
                    instance.image.arch
                );
                this.data.imageId = image.id;

                if (image.state !== EScalewayImageState.AVAILABLE) {
                    return this.waitTask();
                }

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
                const image = await api.getImage(this.data.imageId as string);

                if (!image || image.state !== EScalewayImageState.AVAILABLE) {
                    return this.waitTask();
                }

                const instance = await api.getInstance(this.data.instanceId as string);

                // Remove instance
                await api.deleteInstance(instance.id);

                await api.deleteVolume(instance.volumes[ 0 ].id);

                if (instance.public_ips) {
                    await api.deleteIP(instance.public_ips[ 0 ].id as string);
                }

                // Update connector configuration
                const commander = new CommanderFrontendClient(
                    context.url,
                    context.useragent,
                    this.task.jwt,
                    this.agents
                );
                const connector = await commander.getConnectorById(
                    this.task.projectId,
                    this.task.connectorId
                );
                const connectorConfig = connector.config as IConnectorScalewayConfig;
                connectorConfig.snapshotId = this.data.snapshotId as string;
                connectorConfig.imageId = image.id as string;

                await commander.updateConnector(
                    this.task.projectId,
                    this.task.connectorId,
                    {
                        name: connector.name,
                        credentialId: connector.credentialId,
                        config: connectorConfig,
                        proxiesMax: connector.proxiesMax,
                        proxiesTimeoutDisconnected: connector.proxiesTimeoutDisconnected,
                        proxiesTimeoutUnreachable: connector.proxiesTimeoutUnreachable,
                    }
                );

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
        const api = new ScalewayApi(
            this.data.secretAccessKey,
            this.data.region,
            this.data.projectId,
            this.agents
        );

        if (this.data.instanceId) {
            const instance = await api.getInstance(this.data.instanceId as string);

            if (instance) {
                await api.deleteInstance(this.data.instanceId as string);
            }
        }
    }
}


export class ScalewayInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_SCALEWAY_TYPE}`;

    static readonly stepMax = 6;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new ScalewayInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IScalewayInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
