import {
    ATaskCommand,
    CONNECTOR_AZURE_TYPE,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import { TaskStepError } from '../../../errors';
import {
    Agents,

    validate,
} from '../../../helpers';
import { AzureApi } from '../api';
import { schemaCredential } from '../azure.validation';
import type { IConnectorAzureCredential } from '../azure.interface';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IAzureUninstallCommandData extends IConnectorAzureCredential {
    resourceGroupName: string;
    imageResourceGroupName: string;
}


const schemaData = schemaCredential.keys({
    resourceGroupName: Joi.string()
        .required(),
    imageResourceGroupName: Joi.string()
        .required(),
});


class AzureUninstallCommand extends ATaskCommand {
    private readonly data: IAzureUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IAzureUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new AzureApi(
            this.data.tenantId,
            this.data.clientId,
            this.data.secret,
            this.data.subscriptionId,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                try {
                    await api.deleteResourceGroup(this.data.resourceGroupName);
                } catch (err: any) {
                    if (err.code !== 'ResourceGroupNotFound') {
                        throw err;
                    }
                }

                try {
                    await api.deleteResourceGroup(this.data.imageResourceGroupName);
                } catch (err: any) {
                    if (err.code !== 'ResourceGroupNotFound') {
                        throw err;
                    }
                }

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Remove resource groups ${this.data.resourceGroupName} and ${this.data.imageResourceGroupName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait resource group to be removed (only if doesn't exist)
                try {
                    await api.getResourceGroup(this.data.resourceGroupName);

                    return this.waitTask();
                } catch (err: any) {
                    if (err.code !== 'ResourceGroupNotFound') {
                        throw err;
                    }
                }

                try {
                    await api.getResourceGroup(this.data.imageResourceGroupName);

                    return this.waitTask();
                } catch (err: any) {
                    if (err.code !== 'ResourceGroupNotFound') {
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


export class AzureUninstallFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_AZURE_TYPE}`;

    static readonly stepMax = 2;

    constructor(private readonly agents: Agents) {
    }

    build(task: ITaskData): ATaskCommand {
        return new AzureUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IAzureUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
