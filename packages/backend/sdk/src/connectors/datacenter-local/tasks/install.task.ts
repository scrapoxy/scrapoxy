import {
    ATaskCommand,
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EImageDatacenterLocalStatus,
    randomName,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import { CommanderFrontendClient } from '../../../commander-client';
import {
    DatacenterLocalClient,
    DatacenterLocalNotFoundError,
} from '../../../datacenter-local';
import { TaskStepError } from '../../../errors';
import {
    Agents,
    validate,
} from '../../../helpers';
import type { IConnectorDatacenterLocalConfig } from '../datacenter-local.interface';
import type {
    ICertificate,
    IImageDatacenterLocalData,
    IImageDatacenterLocalToCreate,
    ITaskContext,
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IDatacenterLocalInstallCommandData {
    url: string;
    subscriptionId: string;
    region: string;
    certificate: ICertificate;
    imageId: string | undefined;
}


const schemaData = Joi.object({
    url: Joi.string()
        .required(),
    subscriptionId: Joi.string()
        .uuid()
        .required(),
    region: Joi.string()
        .required(),
    certificate: Joi.object()
        .required(),
    imageId: Joi.string()
        .optional(),
});


class DatacenterLocalInstallCommand extends ATaskCommand {
    private readonly data: IDatacenterLocalInstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = task.data as IDatacenterLocalInstallCommandData;
    }

    async execute(context: ITaskContext): Promise<ITaskToUpdate> {
        const api = new DatacenterLocalClient(
            this.data.url,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                const imageToCreate: IImageDatacenterLocalToCreate = {
                    id: randomName(),
                    certificate: this.data.certificate,
                };
                const image = await api.createImage(
                    this.data.subscriptionId,
                    this.data.region,
                    imageToCreate
                );

                this.data.imageId = image.id;

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Creating image ${imageToCreate.id}...`,
                    nextRetryTs: Date.now() + 500,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait for an image
                let image: IImageDatacenterLocalData;
                try {
                    image = await api.getImage(
                        this.data.subscriptionId,
                        this.data.region,
                        this.data.imageId as string
                    );
                } catch (err: any) {
                    if (err instanceof DatacenterLocalNotFoundError) {
                        return this.waitTask();
                    }

                    throw err;
                }

                if (image.status !== EImageDatacenterLocalStatus.READY) {
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
                const connectorConfig = connector.config as IConnectorDatacenterLocalConfig;
                connectorConfig.imageId = image.id;

                await commander.updateConnector(
                    this.task.projectId,
                    this.task.connectorId,
                    {
                        name: connector.name,
                        credentialId: connector.credentialId,
                        config: connectorConfig,
                        proxiesMax: connector.proxiesMax,
                        proxiesTimeout: connector.proxiesTimeout,
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
        // Nothing
    }
}


export class DatacenterLocalInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_DATACENTER_LOCAL_TYPE}`;

    static readonly stepMax = 2;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new DatacenterLocalInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IDatacenterLocalInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
