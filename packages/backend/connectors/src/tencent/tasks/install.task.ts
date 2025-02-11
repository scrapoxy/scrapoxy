import { promisify } from 'util';
import { gzip } from 'zlib';
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
    CONNECTOR_TENCENT_TYPE,
    EFingerprintMode,
    formatProxyId,
    generateUseragent,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
    randomName,
} from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import * as Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { TencentApi } from '../api';
import {
    ETencentImageState,
    ETencentInstanceState, 
} from '../tencent.interface';
import type { IConnectorTencentConfig } from '../tencent.interface';
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


export interface ITencentInstallCommandData {
    secretId: string;
    secretKey: string;
    region: string;
    zone: string;
    hostname: string | undefined;
    port: number;
    certificate: ICertificate;
    instanceId: string | undefined;
    instanceType: string;
    imageId: string | undefined;
    fingerprintOptions: IFingerprintOptions;
    installId: string;
}

const gzipAsync = promisify(gzip);
const schemaData = Joi.object({
    secretId: Joi.string()
        .required(),
    secretKey: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    zone: Joi.string()
        .required(),
    projectId: Joi.string()
        .optional,
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
    imageId: Joi.string()
        .optional(),
    fingerprintOptions: Joi.object()
        .required(),
    installId: Joi.string()
        .required(),
});


class TencentInstallCommand extends ATaskCommand {
    private readonly data: ITencentInstallCommandData;

    private readonly transport = new TransportDatacenterServiceImpl();

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as ITencentInstallCommandData;
    }

    async execute(context: ITaskContext): Promise<ITaskToUpdate> {
        const api = new TencentApi(
            this.data.secretId,
            this.data.secretKey,
            this.data.region,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                // Create the instance
                const rawScript = await new InstallScriptBuilder(
                    this.data.port,
                    this.data.certificate
                )
                    .build();
                const compressedBuffer = await gzipAsync(rawScript);
                const compressedBase64 = compressedBuffer.toString('base64');
                const bootstrapScript = [
                    '#!/bin/sh',
                    'cat << \'EOF\' > /tmp/script.gz.b64',
                    compressedBase64,
                    'EOF',
                    '',
                    'base64 -d /tmp/script.gz.b64 > /tmp/script.gz',
                    'gunzip /tmp/script.gz',
                    'chmod +x /tmp/script',
                    '/tmp/script',
                    '', 
                ].join('\n');
                const boundary = '==MYBOUNDARY==';
                const scriptBase64 = Buffer.from(
                    bootstrapScript,
                    'utf-8'
                )
                    .toString('base64');
                const mimeMessage = [
                    'MIME-Version: 1.0',
                    `Content-Type: multipart/mixed; boundary="${boundary}"`,
                    '',
                    `--${boundary}`,
                    'Content-Type: text/x-shellscript',
                    'Content-Transfer-Encoding: base64',
                    '',
                    scriptBase64,
                    `--${boundary}--`,
                ].join('\n');
                const images = await api.describeImages({
                    instanceType: this.data.instanceType, platform: 'Ubuntu', imageType: 'PUBLIC_IMAGE',
                });
                const imageId = images[ 0 ].ImageId;
                const instances = await api.runInstances({
                    instanceName: randomName(),
                    instanceType: this.data.instanceType,
                    count: 1,
                    imageId: imageId,
                    zone: this.data.zone,
                    userData: mimeMessage,
                });

                this.data.instanceId = instances[ 0 ];

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
                // Wait for the instance to be started
                const instances = await api.describeInstances({
                    instancesIds: [
                        this.data.instanceId as string, 
                    ], 
                });

                if (instances.length <= 0) {
                    return this.waitTask();
                }

                const instance = instances[ 0 ];

                if (instance.InstanceState !== ETencentInstanceState.RUNNING ||
                    !instance.PublicIpAddresses ||
                    instance.PublicIpAddresses.length <= 0 ||
                    !instance.PublicIpAddresses[ 0 ]) {
                    return this.waitTask();
                }

                this.data.hostname = instance.PublicIpAddresses[ 0 ];

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
                    type: CONNECTOR_TENCENT_TYPE,
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

            case 3: {
                // Create the image
                const instances = await api.describeInstances({
                    instancesIds: [
                        this.data.instanceId as string, 
                    ], 
                });
                const instance = instances[ 0 ];

                if (instance.InstanceState !== ETencentInstanceState.STOPPED) {
                    return this.waitTask();
                }

                const imageId = await api.createImage(
                    randomName(),
                    this.data.instanceId as string
                );
                this.data.imageId = imageId;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating image ${imageId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 4: { 
                try {
                    const image = await api.describeImage(this.data.imageId as string);

                    if (!image || image.ImageState !== ETencentImageState.NORMAL) {
                        return this.waitTask();
                    }
                } catch (err: any) {
                    return this.waitTask();
                }

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
                const connectorConfig = connector.config as IConnectorTencentConfig;
                connectorConfig.imageId = this.data.imageId as string;

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
        const api = new TencentApi(
            this.data.secretId,
            this.data.secretKey,
            this.data.region,
            this.agents
        );

        if (this.data.instanceId) {
            const instance = await api.describeInstances({
                instancesIds: [
                    this.data.instanceId as string, 
                ], 
            });

            if (instance) {
                await api.terminateInstances([
                    this.data.instanceId as string, 
                ]);
            }
        }
    }
}


export class TencentInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_TENCENT_TYPE}`;

    static readonly stepMax = 5;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new TencentInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: ITencentInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
