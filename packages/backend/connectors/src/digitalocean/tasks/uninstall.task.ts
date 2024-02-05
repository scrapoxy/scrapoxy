import {
    Agents,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    CONNECTOR_DIGITALOCEAN_TYPE,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import { DigitalOceanApi } from '../api';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IDigitalOceanUninstallCommandData {
    token: string;
    snapshotId: string;
}


const schemaData = Joi.object({
    token: Joi.string()
        .required(),
    snapshotId: Joi.string()
        .required(),
});


class DigitalOceanUninstallCommand extends ATaskCommand {
    private readonly data: IDigitalOceanUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = task.data as IDigitalOceanUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new DigitalOceanApi(
            this.data.token,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                // Remove image
                try {
                    if (this.data.snapshotId && this.data.snapshotId.length > 0) {
                        const snapshotId = parseInt(this.data.snapshotId);
                        await api.deleteSnapshot(snapshotId);
                    }
                } catch (err: any) {
                    if (err.id !== 'not_found') {
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


export class DigitalUninstallOceanFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_DIGITALOCEAN_TYPE}`;

    static readonly stepMax = 1;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new DigitalOceanUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IDigitalOceanUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
