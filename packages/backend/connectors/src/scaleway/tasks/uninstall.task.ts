import {
    Agents,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    CONNECTOR_SCALEWAY_TYPE,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import { ScalewayApi } from '../api';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IScalewayUninstallCommandData {
    secretAccessKey: string;
    region: string;
    projectId: string;
    snapshotId: string;
    imageId: string;
}


const schemaData = Joi.object({
    secretAccessKey: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    projectId: Joi.string()
        .required(),
    snapshotId: Joi.string()
        .required(),
    imageId: Joi.string()
        .required(),
});


class ScalewayUninstallCommand extends ATaskCommand {
    private readonly data: IScalewayUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IScalewayUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new ScalewayApi(
            this.data.secretAccessKey,
            this.data.region,
            this.data.projectId,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                const image = await api.getImage(this.data.imageId);

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

                await api.deleteImage(this.data.imageId);

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
                try {
                    await api.getImage(this.data.imageId);

                    return this.waitTask();
                } catch (err: any) {
                    if (!err.message?.includes('not found')) { 
                        throw err;
                    }
                }

                if (!this.data.snapshotId) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip snapshot removal of image ${this.data.imageId}...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }

                await api.deleteSnapshot(this.data.snapshotId);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Removing ${this.data.snapshotId} snapshot for image ${this.data.imageId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 2: {
                // Wait for an active instance with IP
                try {
                    await api.getSnapshot(this.data.snapshotId);

                    return this.waitTask();
                } catch (err: any) {
                    if (!err.message?.includes('not found')) { 
                        throw err;
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


export class ScalewayUninstallFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_SCALEWAY_TYPE}`;

    static readonly stepMax = 3;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new ScalewayUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IScalewayUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
