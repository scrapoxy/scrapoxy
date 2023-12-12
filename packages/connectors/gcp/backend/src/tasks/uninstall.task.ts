import {
    Agents,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import { ATaskCommand } from '@scrapoxy/common';
import { CONNECTOR_GCP_TYPE } from '@scrapoxy/connector-gcp-sdk';
import * as Joi from 'joi';
import { GcpApi } from '../api';
import { EGcpOperationStatus } from '../gcp.interface';
import { schemaCredential } from '../gcp.validation';
import type { IConnectorGcpCredential } from '../gcp.interface';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IGcpUninstallCommandData extends IConnectorGcpCredential{
    zone: string;
    templateName: string;
    firewallName: string;
    deleteTemplateOpId: string | undefined;
    deleteImageOpId: string | undefined;
    deleteFirewallOpId: string | undefined;
}


const schemaData = schemaCredential.keys({
    zone: Joi.string()
        .required(),
    templateName: Joi.string()
        .required(),
    firewallName: Joi.string()
        .required(),
    deleteTemplateOpId: Joi.string()
        .optional(),
    deleteImageOpId: Joi.string()
        .optional(),
    deleteFirewallOpId: Joi.string()
        .optional(),
});


class GcpUninstallCommand extends ATaskCommand {
    private readonly data: IGcpUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IGcpUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new GcpApi(
            this.data.projectId,
            this.data.clientEmail,
            this.data.privateKeyId,
            this.data.privateKey,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                try {
                    await api.getTemplate(this.data.templateName);

                    const deleteTemplateOp = await api.deleteTemplate(this.data.templateName);
                    this.data.deleteTemplateOpId = deleteTemplateOp.id;

                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Remove template ${this.data.templateName}...`,
                        nextRetryTs: Date.now() + 4000,
                        data: this.data,
                    };

                    return taskToUpdate;
                } catch (err: any) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip template ${this.data.templateName} removal...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }
            }

            case 1: {
                // Wait template to be removed (only if doesn't exist)
                if (this.data.deleteTemplateOpId) {
                    const deleteTemplateOp = await api.getGlobalOperation(this.data.deleteTemplateOpId as string);

                    if (deleteTemplateOp.status !== EGcpOperationStatus.DONE) {
                        return this.waitTask();
                    }
                }

                const imageName = `${this.data.templateName}-image`;

                try {
                    await api.getImage(imageName);

                    const deleteImageOp = await api.deleteImage(imageName);
                    this.data.deleteImageOpId = deleteImageOp.id;

                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Remove image ${imageName}...`,
                        nextRetryTs: Date.now() + 4000,
                        data: this.data,
                    };

                    return taskToUpdate;
                } catch (err: any) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip image ${imageName} removal...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }
            }

            case 2: {
                // Wait image to be removed (only if doesn't exist)
                if (this.data.deleteImageOpId) {
                    const deleteImageOp = await api.getGlobalOperation(this.data.deleteImageOpId as string);

                    if (deleteImageOp.status !== EGcpOperationStatus.DONE) {
                        return this.waitTask();
                    }
                }

                try {
                    await api.getFirewall(this.data.firewallName);

                    const deleteFirewallOp = await api.deleteFirewall(this.data.firewallName);
                    this.data.deleteFirewallOpId = deleteFirewallOp.id;

                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Remove firewall ${this.data.firewallName}...`,
                        nextRetryTs: Date.now() + 4000,
                        data: this.data,
                    };

                    return taskToUpdate;
                } catch (err: any) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip firewall ${this.data.firewallName} removal...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }
            }

            case 3: {
                // Wait firewall to be removed (only if doesn't exist)
                if (this.data.deleteImageOpId) {
                    const deleteFirewallOp = await api.getGlobalOperation(this.data.deleteFirewallOpId as string);

                    if (deleteFirewallOp.status !== EGcpOperationStatus.DONE) {
                        return this.waitTask();
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


export class GcpUninstallFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_GCP_TYPE}`;

    static readonly stepMax = 4;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new GcpUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IGcpUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
