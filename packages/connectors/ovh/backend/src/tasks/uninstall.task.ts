import {
    Agents,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import { ATaskCommand } from '@scrapoxy/common';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/connector-ovh-sdk';
import * as Joi from 'joi';
import { OvhApi } from '../api';
import { schemaCredential } from '../ovh.validation';
import type { IConnectorOvhCredential } from '../ovh.interface';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IOvhUninstallCommandData extends IConnectorOvhCredential {
    projectId: string;
    region: string;
    snapshotId: string;
}


const schemaData = schemaCredential.keys({
    projectId: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    snapshotId: Joi.string()
        .optional(),
});


class OvhUninstallCommand extends ATaskCommand {
    private readonly data: IOvhUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IOvhUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new OvhApi(
            this.data.appKey,
            this.data.appSecret,
            this.data.consumerKey,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                if (this.data.snapshotId && this.data.snapshotId.length > 0) {
                    await api.removeSnapshot(
                        this.data.projectId,
                        this.data.snapshotId
                    );
                }

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: 'Remove snapshot...',
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait snapshot to be removed (only if doesn't exist)
                try {
                    if (this.data.snapshotId && this.data.snapshotId.length > 0) {
                        await api.getSnapshot(
                            this.data.projectId,
                            this.data.snapshotId
                        );

                        return this.waitTask();
                    }
                } catch (err: any) {
                    if (err.errorClass !== 'Client::NotFound') {
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


export class OvhUninstallFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_OVH_TYPE}`;

    static readonly stepMax = 2;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new OvhUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IOvhUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
