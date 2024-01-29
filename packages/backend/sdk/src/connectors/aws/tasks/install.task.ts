import {
    ATaskCommand,
    CONNECTOR_AWS_TYPE,
    EFingerprintMode,
    formatProxyId,
    generateUseragent,
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
import { AwsApi } from '../api';
import type { IProxyToConnectConfigDatacenter } from '../../../transports';
import type { IConnectorAwsConfig } from '../aws.interface';
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


export interface IAwsInstallCommandData {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    hostname: string | undefined;
    port: number;
    certificate: ICertificate;
    securityGroupName: string;
    instanceId: string | undefined;
    instanceType: string;
    imageId: string | undefined;
    fingerprintOptions: IFingerprintOptions;
    installId: string;
}


const schemaData = Joi.object({
    accessKeyId: Joi.string()
        .required(),
    secretAccessKey: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    hostname: Joi.string()
        .optional(),
    port: Joi.number()
        .required(),
    certificate: Joi.object()
        .required(),
    securityGroupName: Joi.string()
        .required(),
    instanceId: Joi.string()
        .optional(),
    instanceType: Joi.string()
        .required(),
    imageId: Joi.string()
        .optional(),
    fingerprintOptions: Joi.object()
        .required(),
    installId: Joi.string()
        .required(),
});


class AwsInstallCommand extends ATaskCommand {
    private readonly data: IAwsInstallCommandData;

    private readonly transport = new TransportDatacenterServiceImpl();

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IAwsInstallCommandData;
    }

    async execute(context: ITaskContext): Promise<ITaskToUpdate> {
        const api = new AwsApi(
            this.data.accessKeyId,
            this.data.secretAccessKey,
            this.data.region,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                // Create security group
                try {
                    await api.createSecurityGroup(this.data.securityGroupName);
                } catch (err: any) {
                    if (err.code !== 'InvalidGroup.Duplicate') {
                        throw err;
                    }
                }

                // Add security rule
                try {
                    await api.authorizeSecurityGroupIngress(
                        this.data.securityGroupName,
                        [
                            {
                                protocol: 'tcp',
                                fromPort: this.data.port,
                                toPort: this.data.port,
                                cidrIp: '0.0.0.0/0',
                            },
                        ]
                    );
                } catch (err: any) {
                    if (err.code !== 'InvalidPermission.Duplicate') {
                        throw err;
                    }
                }

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating security group ${this.data.securityGroupName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Find the image
                const images = await api.describeImages({
                    architecture: 'x86_64',
                    imageType: 'machine',
                    isPublic: true,
                    name: 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*',
                    ownerAlias: 'amazon',
                    state: 'available',
                    virtualizationType: 'hvm',
                });

                if (images.length <= 0) {
                    throw new Error('Cannot find any ubuntu 22.04 image');
                }

                const imagesSorted = images.sort((
                    a, b
                ) => b.creationDate[ 0 ].localeCompare(a.creationDate[ 0 ]));
                const imageId = imagesSorted[ 0 ].imageId[ 0 ];
                // Create instance
                const userData = await new InstallScriptBuilder(this.data.certificate)
                    .build();
                const instances = await api.runInstances({
                    count: 1,
                    imageId,
                    instanceType: this.data.instanceType,
                    securityGroup: this.data.securityGroupName,
                    userData,
                    terminateOnShutdown: true,
                });

                this.data.instanceId = instances[ 0 ].instanceId[ 0 ];

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating instance ${this.data.instanceId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 2: {
                // Wait for an active instance with IP
                const instances = await api.describeInstances({
                    instancesIds: [
                        this.data.instanceId as string,
                    ],
                });

                if (instances.length <= 0) {
                    return this.waitTask();
                }

                const instance = instances[ 0 ];

                if (instance.instanceState[ 0 ].code[ 0 ] !== '16' ||
                    !instance.ipAddress ||
                    instance.ipAddress.length <= 0 ||
                    instance.ipAddress[ 0 ].length <= 0) {
                    return this.waitTask();
                }

                this.data.hostname = instance.ipAddress[ 0 ];

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Fingerprinting instance ${this.data.instanceId}...`,
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
                    type: CONNECTOR_AWS_TYPE,
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

                // Stop the instance
                await api.stopInstances([
                    this.data.instanceId as string,
                ]);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Stopping instance ${this.data.instanceId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 4: {
                // Wait stop instance finish
                const instances = await api.describeInstances({
                    instancesIds: [
                        this.data.instanceId as string,
                    ],
                });
                const instance = instances[ 0 ];

                if (instance.instanceState[ 0 ].code[ 0 ] !== '80') {
                    return this.waitTask();
                }

                // Create an AMI
                const imageName = randomName();
                this.data.imageId = await api.createImage(
                    imageName,
                    this.data.instanceId as string
                );

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
                // Wait snapshot action to finish
                const image = await api.describeImage(this.data.imageId as string);

                if (
                    !image ||
                    image.imageState[ 0 ] !== 'available'
                ) {
                    return this.waitTask();
                }

                // Remove instance
                await api.terminateInstances([
                    this.data.instanceId as string,
                ]);

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
                const connectorConfig = connector.config as IConnectorAwsConfig;
                connectorConfig.imageId = image.imageId[ 0 ] as string;

                await commander.updateConnector(
                    this.task.projectId,
                    this.task.connectorId,
                    {
                        name: connector.name,
                        credentialId: connector.credentialId,
                        config: connectorConfig,
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
        const api = new AwsApi(
            this.data.accessKeyId,
            this.data.secretAccessKey,
            this.data.region,
            this.agents
        );

        if (this.data.instanceId) {
            const instances = await api.describeInstances({
                instancesIds: [
                    this.data.instanceId as string,
                ],
            });

            if (instances.length > 0) {
                const instance = instances[ 0 ];

                if (instance.instanceState[ 0 ].code[ 0 ] !== '48') {
                    await api.terminateInstances([
                        this.data.instanceId as string,
                    ]);
                }
            }
        }
    }
}


export class AwsInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_AWS_TYPE}`;

    static readonly stepMax = 6;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new AwsInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IAwsInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
