import {
    Agents,
    TaskStepError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    ATaskCommand,
    CONNECTOR_AWS_TYPE,
} from '@scrapoxy/common';
import * as Joi from 'joi';
import { AwsApi } from '../api';
import type {
    ITaskData,
    ITaskFactory,
    ITaskToUpdate,
} from '@scrapoxy/common';


export interface IAwsUninstallCommandData {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    securityGroupName: string;
    imageId: string;
    snapshotsIds: string[];
}


const schemaData = Joi.object({
    accessKeyId: Joi.string()
        .required(),
    secretAccessKey: Joi.string()
        .required(),
    region: Joi.string()
        .required(),
    securityGroupName: Joi.string()
        .required(),
    imageId: Joi.string()
        .required(),
    snapshotsIds: Joi.array()
        .items(Joi.string())
        .required(),
});


class AwsUninstallCommand extends ATaskCommand {
    private readonly data: IAwsUninstallCommandData;

    constructor(
        task: ITaskData,
        private readonly agents: Agents
    ) {
        super(task);

        this.data = this.task.data as IAwsUninstallCommandData;
    }

    async execute(): Promise<ITaskToUpdate> {
        const api = new AwsApi(
            this.data.accessKeyId,
            this.data.secretAccessKey,
            this.data.region,
            this.agents
        );

        switch (this.task.stepCurrent) {
            case 0: {
                const securityGroupExists = await api.hasSecurityGroup(this.data.securityGroupName);

                if (!securityGroupExists) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip removal of security group ${this.data.securityGroupName}...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }

                await api.deleteSecurityGroup(this.data.securityGroupName);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Removing security group ${this.data.securityGroupName}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 1: {
                // Wait security group to be removed (only if doesn't exist)
                const securityGroupExists = await api.hasSecurityGroup(this.data.securityGroupName);

                if (securityGroupExists) {
                    return this.waitTask();
                }

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

                this.data.snapshotsIds = [];
                for (const block of image.blockDeviceMapping) {
                    if (block) {
                        for (const item of block.item) {
                            if (item?.ebs) {
                                for (const ebs of item.ebs) {
                                    this.data.snapshotsIds.push(...ebs.snapshotId);
                                }
                            }
                        }
                    }
                }

                await api.deregisterImage(this.data.imageId);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Deregistering image ${this.data.imageId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 2: {
                // Wait image to be deregistered (only if doesn't exist)
                const image = await api.describeImage(this.data.imageId);

                if (image) {
                    return this.waitTask();
                }

                if (this.data.snapshotsIds.length <= 0) {
                    const taskToUpdate: ITaskToUpdate = {
                        running: this.task.running,
                        stepCurrent: this.task.stepCurrent + 1,
                        message: `Skip snapshot removal of image ${this.data.imageId}...`,
                        nextRetryTs: Date.now(),
                        data: this.data,
                    };

                    return taskToUpdate;
                }

                const promises = this.data.snapshotsIds.map((snapshotId) =>
                    api.deleteSnapshot(snapshotId));

                await Promise.all(promises);

                const taskToUpdate: ITaskToUpdate = {
                    running: this.task.running,
                    stepCurrent: this.task.stepCurrent + 1,
                    message: `Removing ${this.data.snapshotsIds.length} snapshots for image ${this.data.imageId}...`,
                    nextRetryTs: Date.now() + 4000,
                    data: this.data,
                };

                return taskToUpdate;
            }

            case 3: {
                // Wait for an active instance with IP
                const snapshotsExists = await api.hasAllSnapshots(this.data.snapshotsIds);

                if (snapshotsExists) {
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


export class AwsUninstallFactory implements ITaskFactory {
    static readonly type = `imageremove::${CONNECTOR_AWS_TYPE}`;

    static readonly stepMax = 4;

    constructor(private readonly agents: Agents) {}

    build(task: ITaskData): ATaskCommand {
        return new AwsUninstallCommand(
            task,
            this.agents
        );
    }

    async validate(data: IAwsUninstallCommandData): Promise<void> {
        await validate(
            schemaData,
            data
        );
    }
}
