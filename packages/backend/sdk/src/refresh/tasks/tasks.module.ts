import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { REFRESH_TASKS_MODULE_CONFIG } from './tasks.constants';
import { RefreshTasksService } from './tasks.service';
import { CommanderRefreshClientModule } from '../../commander-client';
import {
    formatUseragent,
    getEnvBackendJwtConfig,
} from '../../helpers';
import { TasksModule } from '../../tasks';
import type { ICommanderRefreshClientModuleConfig } from '../../commander-client';
import type { IRefreshConfig } from '../refresh.abstract';
import type { DynamicModule } from '@nestjs/common';


export interface IRefreshTasksModuleConfig extends ICommanderRefreshClientModuleConfig, IRefreshConfig {}


@Module({})
export class RefreshTasksModule {
    static forRoot(
        url: string,
        version: string
    ): DynamicModule {
        const config: IRefreshTasksModuleConfig = {
            url,
            useragent: formatUseragent(version),
            jwt: getEnvBackendJwtConfig(),
            emptyDelay: parseInt(
                process.env.TASKS_REFRESH_EMPTY_DELAY ?? ONE_SECOND_IN_MS.toString(),
                10
            ),
            errorDelay: parseInt(
                process.env.TASKS_REFRESH_ERROR_DELAY ?? (2 * ONE_SECOND_IN_MS).toString(),
                10
            ),
        };

        return {
            module: RefreshTasksModule,
            imports: [
                ScheduleModule.forRoot(), TasksModule, CommanderRefreshClientModule.forRoot(config),
            ],
            providers: [
                {
                    provide: REFRESH_TASKS_MODULE_CONFIG,
                    useValue: config,
                },
                RefreshTasksService,
            ],
        };
    }
}
