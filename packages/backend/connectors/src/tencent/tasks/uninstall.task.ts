import {
    Agents,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    CONNECTOR_TENCENT_TYPE,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import { TencentApi } from '../api';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface ITencentUninstallCommandData {
    secretId: string;
    secretKey: string;
    region: string;
    imageId: string;
}


const schemaData = Joi.object({
    secretId: Joi.string()
        .required(),
    secretKey: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    imageId: Joi.string()
        .required(),
});


class TencentUninstallCommand extends ATaskCommand {
    private readonly data: ITencentUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as ITencentUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new TencentApi(
            this.data.secretId,
            this.data.secretKey,
            this.data.region,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                const image = await api.describeImage(this.data.imageId);

                if (!image) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip deregister of image ${this.data.imageId}...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }

                await api.deleteImages([
                    this.data.imageId,
                ]);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Deregistering image ${this.data.imageId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait image to be deregistered (only if doesn't exist)
                const image = await api.describeImage(this.data.imageId);

                if (image) {
                    return this.waitTask();
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


export class TencentUninstallFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_TENCENT_TYPE}`;

    static readonly stepMax = 2;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new TencentUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: ITencentUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
