import {
    Agents,
    DatacenterLocalClient,
    DatacenterLocalNotFoundError,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    CONNECTOR_DATACENTER_LOCAL_TYPE,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IDatacenterLocalUninstallCommandData {
    url: string;
    subscriptionId: string;
    region: string;
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
    imageId: Joi.string()
        .optional(),
});


class DatacenterLocalUninstallCommand extends ATaskCommand {
    private readonly data: IDatacenterLocalUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IDatacenterLocalUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new DatacenterLocalClient(
            this.data.url,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                if (!this.data.imageId) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: 'Skipping removing image...',
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }

                await api.removeImage(
                    this.data.subscriptionId,
                    this.data.region,
                    this.data.imageId
                );

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Removing image ${this.data.imageId}...`,
                    nextRetryTs: Date.now() + 500,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait image to be removed
                if (this.data.imageId) {
                    try {
                        await api.getImage(
                            this.data.subscriptionId,
                            this.data.region,
                            this.data.imageId
                        );

                        return this.waitTask();
                    } catch (err: any) {
                        if (!(err instanceof DatacenterLocalNotFoundError)) {
                            throw err;
                        }
                    }
                }

                // No next step
                const taskToUpdate: ITaskToUpdate = {
                    running: false,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Connector uninstalled.',
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


export class DatacenterLocalUninstallFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_DATACENTER_LOCAL_TYPE}`;

    static readonly stepMax = 2;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new DatacenterLocalUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IDatacenterLocalUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
