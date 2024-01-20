import {
    Agents,
    CommanderFrontendClient,
    fingerprint,
    InstallScriptBuilder,
    TaskStepError,
    TransportDatacenterServiceImpl,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    EFingerprintMode,
    formatProxyId,
    generateUseragent,
    randomName,
} from '@scrapoxy/common';
import {
    CONNECTOR_DIGITALOCEAN_TYPE,
    DIGITALOCEAN_DEFAULT_SIZE,
} from '@scrapoxy/connector-digitalocean-sdk';
import { Sockets } from '@scrapoxy/proxy-sdk';
import * as Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { DigitalOceanApi } from '../api';
import { getDigitalOceanPublicAddress } from '../digitalocean.helpers';
import {
    EDigitalOceanActionStatus,
    EDigitalOceanDropletStatus,
} from '../digitalocean.interface';
import type { IConnectorDigitalOceanConfig } from '../digitalocean.interface';
import type { IProxyToConnectConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IFingerprintOptions,
    IFingerprintRequest,
    IProxyToConnect,
    ITaskContext,
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IDigitalOceanInstallCommandData {
    token: string;
    region: string;
    hostname: string | undefined;
    port: number;
    certificate: ICertificate;
    dropletId: number | undefined;
    powerOffActionId: number | undefined;
    snapshotActionId: number | undefined;
    fingerprintOptions: IFingerprintOptions;
    installId: string;
}


const schemaData = Joi.object({
    token: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    hostname: Joi.string()
        .optional(),
    port: Joi.number()
        .required(),
    certificate: Joi.object()
        .required(),
    dropletId: Joi.number()
        .optional()
        .min(0),
    powerOffActionId: Joi.number()
        .optional()
        .min(0),
    snapshotActionId: Joi.number()
        .optional()
        .min(0),
    fingerprintOptions: Joi.object()
        .required(),
    installId: Joi.string()
        .required(),
});


class DigitalOceanInstallCommand extends ATaskCommand {
    private readonly data: IDigitalOceanInstallCommandData;

    private readonly transport = new TransportDatacenterServiceImpl();

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = task.data as IDigitalOceanInstallCommandData;
    }

    async execute(context: ITaskContext): Promise<ITaskToUpdate> {
        const api = new DigitalOceanApi(
            this.data.token,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                // Create Droplet
                const userData = await new InstallScriptBuilder(this.data.certificate)
                    .build();
                const droplet = await api.createDropletReference({
                    name: randomName(),
                    region: this.data.region,
                    imageName: 'ubuntu-20-04-x64',
                    size: DIGITALOCEAN_DEFAULT_SIZE,
                    userData,
                });
                this.data.dropletId = droplet.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Creating droplet...',
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait for an active droplet with IP
                const droplet = await api.getDroplet(this.data.dropletId as number);
                this.data.hostname = getDigitalOceanPublicAddress(droplet);

                if (droplet.status !== EDigitalOceanDropletStatus.ACTIVE || !this.data.hostname) {
                    return this.waitTask();
                }

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Fingerprinting droplet ${droplet.name}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 2: {
                // Wait for a reachable droplet
                const config: IProxyToConnectConfigDatacenter = {
                    address: {
                        hostname: this.data.hostname as string,
                        port: this.data.port,
                    },
                    certificate: this.data.certificate,
                };
                const key = uuid();
                const proxy: IProxyToConnect = {
                    id: formatProxyId(
                        this.task.connectorId,
                        key
                    ),
                    type: CONNECTOR_DIGITALOCEAN_TYPE,
                    connectorId: this.task.connectorId,
                    projectId: this.task.projectId,
                    key,
                    config,
                    useragent: generateUseragent(),
                };
                const sockets = new Sockets();
                try {
                    const payload: IFingerprintRequest = {
                        installId: this.data.installId,
                        mode: EFingerprintMode.INSTALL,
                        connectorType: proxy.type,
                        proxyId: proxy.id,
                        bytesReceived: 0,
                        bytesSent: 0,
                        requests: 0,
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

                // Power Off the droplet
                const action = await api.powerOffDroplet(this.data.dropletId as number);
                this.data.powerOffActionId = action.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Stopping droplet...',
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 3: {
                // Wait power off action to finish
                const powerOffAction = await api.getAction(this.data.powerOffActionId as number);

                if (powerOffAction.status === EDigitalOceanActionStatus.INPROGRESS) {
                    return this.waitTask();
                }

                // Create a snapshot
                const snapshotAction = await api.snapshotDroplet(this.data.dropletId as number);
                this.data.snapshotActionId = snapshotAction.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Creating snapshot...',
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 4: {
                // Wait snapshot action to finish
                const snapshotAction = await api.getAction(this.data.snapshotActionId as number);

                if (snapshotAction.status === EDigitalOceanActionStatus.INPROGRESS) {
                    return this.waitTask();
                }

                // Get snapshot
                const snapshots = await api.getDropletSnapshots(this.data.dropletId as number);

                if (snapshots.length <= 0) {
                    throw new Error('Cannot find snapshot');
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
                const connectorConfig = connector.config as IConnectorDigitalOceanConfig;
                connectorConfig.snapshotId = snapshots[ 0 ].id.toString(10);

                await commander.updateConnector(
                    this.task.projectId,
                    this.task.connectorId,
                    {
                        name: connector.name,
                        credentialId: connector.credentialId,
                        config: connectorConfig,
                    }
                );

                // Remove droplet
                await api.deleteDroplet(this.data.dropletId as number);

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
        const api = new DigitalOceanApi(
            this.data.token,
            this.agents
        );

        if (this.data.dropletId) {
            await api.deleteDroplet(this.data.dropletId);
        }
    }
}


export class DigitalInstallOceanFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_DIGITALOCEAN_TYPE}`;

    static readonly stepMax = 5;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new DigitalOceanInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IDigitalOceanInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
