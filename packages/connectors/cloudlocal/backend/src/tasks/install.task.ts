import {
    Agents,
    CommanderFrontendClient,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CloudlocalClient,
    ImageCloudlocalNotFoundError,
} from '@scrapoxy/cloudlocal';
import {
    ATaskCommand,
    randomName,
} from '@scrapoxy/common';
import {
    CONNECTOR_CLOUDLOCAL_TYPE,
    EImageCloudlocalStatus,
} from '@scrapoxy/connector-cloudlocal-sdk';
import * as Joi from 'joi';
import type { IConnectorCloudlocalConfig } from '../cloudlocal.interface';
import type {
    ICertificate,
    ITaskContext,
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';
import type {
    IImageCloudlocalData,
    IImageCloudlocalToCreate,
} from '@scrapoxy/connector-cloudlocal-sdk';


export interface ICloudlocalInstallCommandData {
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


class CloudlocalInstallCommand extends ATaskCommand {
    private readonly data: ICloudlocalInstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = task.data as ICloudlocalInstallCommandData;
    }

    async execute(context: ITaskContext): Promise<ITaskToUpdate> {
        const api = new CloudlocalClient(
            this.data.url,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                const imageToCreate: IImageCloudlocalToCreate = {
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
                let image: IImageCloudlocalData;
                try {
                    image = await api.getImage(
                        this.data.subscriptionId,
                        this.data.region,
                        this.data.imageId as string
                    );
                } catch (err: any) {
                    if (err instanceof ImageCloudlocalNotFoundError) {
                        return this.waitTask();
                    }

                    throw err;
                }

                if (image.status !== EImageCloudlocalStatus.READY) {
                    return this.waitTask();
                }

                // Update connector configuration
                const commander = new CommanderFrontendClient(
                    context.url,
                    this.task.jwt,
                    this.agents
                );
                const connector = await commander.getConnectorById(
                    this.task.projectId,
                    this.task.connectorId
                );
                const connectorConfig = connector.config as IConnectorCloudlocalConfig;
                connectorConfig.imageId = image.id;

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
        // Nothing
    }
}


export class CloudlocalInstallFactory implements ITaskFactory {
    static readonly type = `imagecreate::${CONNECTOR_CLOUDLOCAL_TYPE}`;

    static readonly stepMax = 2;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new CloudlocalInstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: ICloudlocalInstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
