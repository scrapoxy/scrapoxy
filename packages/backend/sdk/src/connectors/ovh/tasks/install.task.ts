import {
    ATaskCommand,
    CONNECTOR_OVH_TYPE,
    EFingerprintMode,
    formatProxyId,
    generateUseragent,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
    randomName,
} from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import * as Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { CommanderFrontendClient } from '../../../commander-client';
import { TaskStepError } from '../../../errors';
import { fingerprint } from '../../../fingerprint';
import {
    Agents,
    InstallScriptBuilder,
    validate,
} from '../../../helpers';
import { TransportDatacenterServiceImpl } from '../../../transports';
import { OvhApi } from '../api';
import { getOvhExternalIp } from '../ovh.helpers';
import {
    EOvhInstanceStatus,
    EOvhSnapshotStatus,
    EOvhVisibility,
} from '../ovh.interface';
import { schemaCredential } from '../ovh.validation';
import type { IProxyToConnectConfigDatacenter } from '../../../transports';
import type {
    IConnectorOvhConfig,
    IConnectorOvhCredential,
} from '../ovh.interface';
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


export interface IOvhInstallCommandData extends IConnectorOvhCredential {
    projectId: string;
    region: string;
    flavorId: string;
    hostname: string | undefined;
    port: number;
    certificate: ICertificate;
    installInstanceId: string | undefined;
    snapshotName: string | undefined;
    snapshotId: string | undefined;
    fingerprintOptions: IFingerprintOptions;
    installId: string;
}


const schemaData = schemaCredential.keys({
    projectId: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    flavorId: Joi.string()
        .required(),
    hostname: Joi.string()
        .optional(),
    port: Joi.number()
        .required(),
    certificate: Joi.object()
        .required(),
    installInstanceId: Joi.string()
        .optional(),
    snapshotName: Joi.string()
        .optional(),
    snapshotId: Joi.string()
        .optional(),
    fingerprintOptions: Joi.object()
        .required(),
    installId: Joi.string()
        .required(),
});


class OvhInstallCommand extends ATaskCommand {
    private readonly data: IOvhInstallCommandData;

    private readonly transport = new TransportDatacenterServiceImpl();

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IOvhInstallCommandData;
    }

    async execute(context: ITaskContext): Promise<ITaskToUpdate> {
        const api = new OvhApi(
            this.data.appKey,
            this.data.appSecret,
            this.data.consumerKey,
            this.agents
        );
        switch (this.task.stepCurrent) {
            case 0: {
                // Create install instance
                const userData = await new InstallScriptBuilder(this.data.certificate)
                    .build();
                // Find image
                const images = await api.getAllImages(
                    this.data.projectId,
                    this.data.region
                );
                const image = images.find((i) => i.name === 'Ubuntu 22.04');

                if (!image) {
                    throw new Error('Cannot find Ubuntu 22.04 image');
                }

                const instances = await api.createInstances({
                    projectId: this.data.projectId,
                    region: this.data.region,
                    name: randomName(),
                    flavorId: this.data.flavorId,
                    imageId: image.id,
                    userData,
                    count: 1,
                });
                this.data.installInstanceId = instances[ 0 ].id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating instance ${instances[ 0 ].name}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait instance to be created
                const instance = await api.getInstance(
                    this.data.projectId,
                    this.data.installInstanceId as string
                );

                if (instance.status === EOvhInstanceStatus.BUILD) {
                    return this.waitTask();
                }

                if (instance.status !== EOvhInstanceStatus.ACTIVE) {
                    throw new Error(`Instance ${instance.name} cannot be started`);
                }

                this.data.hostname = getOvhExternalIp(instance);

                if (!this.data.hostname) {
                    return this.waitTask();
                }

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Fingerprinting instance ${instance.name}...`,
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
                    type: CONNECTOR_OVH_TYPE,
                    connectorId: this.task.connectorId,
                    projectId: this.task.projectId,
                    key,
                    config,
                    useragent: generateUseragent(),
                    timeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
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

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Creating snapshot...',
                    nextRetryTs: Date.now() + 10000, // Wait 10 seconds
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 3: {
                // Create snapshot
                this.data.snapshotName = randomName();

                await api.snapshotInstance(
                    this.data.projectId,
                    this.data.installInstanceId as string,
                    this.data.snapshotName
                );

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Waiting snapshot ${this.data.snapshotName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 4: {
                // Wait snapshot to be created
                const snapshots = await api.getAllSnapshots(
                    this.data.projectId,
                    this.data.region
                );
                const snapshot = snapshots.find((s) => s.name === this.data.snapshotName);

                if (!snapshot) {
                    return this.waitTask();
                }

                this.data.snapshotId = snapshot.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Saving snapshot ${this.data.snapshotName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 5: {
                // Wait snapshot to be saved
                const snapshot = await api.getSnapshot(
                    this.data.projectId,
                    this.data.snapshotId as string
                );

                if (snapshot.visibility !== EOvhVisibility.private) {
                    throw new Error(`Snapshot ${snapshot.name} is not private`);
                }

                if (snapshot.status !== EOvhSnapshotStatus.active) {
                    return this.waitTask();
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
                const connectorConfig = connector.config as IConnectorOvhConfig;
                connectorConfig.snapshotId = snapshot.id;

                await commander.updateConnector(
                    this.task.projectId,
                    this.task.connectorId,
                    {
                        name: connector.name,
                        credentialId: connector.credentialId,
                        config: connectorConfig,
                        proxiesMax: connector.proxiesMax,
                        proxiesTimeoutDisconnected: connector.proxiesTimeoutDisconnected,
                    }
                );

                // Remove instance
                await api.removeInstance(
                    this.data.projectId,
                    this.data.installInstanceId as string
                );

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Removing instance...',
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 6: {
                // Wait instance to be deleted
                try {
                    await api.getInstance(
                        this.data.projectId,
                        this.data.installInstanceId as string
                    );

                    return this.waitTask();
                } catch (err: any) {
                    if (err.errorClass !== 'Client::NotFound') {
                        throw err;
                    }
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
        const api = new OvhApi(
            this.data.appKey,
            this.data.appSecret,
            this.data.consumerKey,
            this.agents
        );

        // Remove instance
        if (this.data.installInstanceId) {
            await api.removeInstance(
                this.data.projectId,
                this.data.installInstanceId as string
            );
        }
    }
}


export class OvhInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_OVH_TYPE}`;

    static readonly stepMax = 7;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new OvhInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IOvhInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
