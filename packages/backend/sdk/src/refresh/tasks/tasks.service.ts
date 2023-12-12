import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { REFRESH_TASKS_MODULE_CONFIG } from './tasks.constants';
import {
    CommanderRefreshClientService,
    NoTaskToRefreshError,
} from '../../commander-client';
import { TasksService } from '../../tasks';
import { ARefresh } from '../refresh.abstract';
import type { IRefreshTasksModuleConfig } from './tasks.module';
import type {
    ITaskContext,
    ITaskData,
    ITaskToUpdate,
} from '@scrapoxy/common';


@Injectable()
export class RefreshTasksService extends ARefresh<ITaskData> {
    protected readonly logger = new Logger(RefreshTasksService.name);

    private readonly context: ITaskContext;

    constructor(
    @Inject(REFRESH_TASKS_MODULE_CONFIG)
        config: IRefreshTasksModuleConfig,
        private readonly commander: CommanderRefreshClientService,
        private readonly tasks: TasksService
    ) {
        super(config);

        this.context = {
            url: config.url,
        };
    }

    async next(): Promise<ITaskData | undefined> {
        try {
            const task = await this.commander.getNextTaskToRefresh();

            return task;
        } catch (err: any) {
            if (err instanceof NoTaskToRefreshError) {
                return;
            }

            throw err;
        }
    }

    async task(task: ITaskData): Promise<void> {
        this.logger.debug(`execute task ${task.id}/${task.type} for project ${task.projectId}`);

        const factory = this.tasks.getFactory(task.type);
        const command = factory.build(task);
        let taskToUpdate: ITaskToUpdate;
        try {
            await this.commander.lockTask(
                task.projectId,
                task.id
            );

            if (task.cancelled) {
                await command.cancel();

                taskToUpdate = {
                    message: 'cancelled',
                    running: false,
                    nextRetryTs: task.nextRetryTs,
                    stepCurrent: task.stepCurrent,
                    data: task.data,
                };
            } else {
                taskToUpdate = await command.execute(this.context);
            }
        } catch (err: any) {
            this.logger.error(err);

            try {
                await command.cancel();

                taskToUpdate = {
                    message: err.message,
                    running: false,
                    nextRetryTs: task.nextRetryTs,
                    stepCurrent: task.stepCurrent,
                    data: task.data,
                };
            } catch (errCancel: any) {
                taskToUpdate = {
                    message: errCancel.message,
                    running: false,
                    nextRetryTs: task.nextRetryTs,
                    stepCurrent: task.stepCurrent,
                    data: task.data,
                };
            }
        }

        await this.commander.updateTask(
            task.projectId,
            task.id,
            taskToUpdate
        );
    }
}
