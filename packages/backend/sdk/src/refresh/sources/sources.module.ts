import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { REFRESH_SOURCES_CONFIG } from './sources.constants';
import { RefreshSourcesService } from './sources.service';
import { CommanderRefreshClientModule } from '../../commander-client';
import {
    formatUseragent,
    getEnvBackendJwtConfig,
} from '../../helpers';
import type { ICommanderRefreshClientModuleConfig } from '../../commander-client';
import type { IRefreshConfig } from '../refresh.abstract';
import type { DynamicModule } from '@nestjs/common';


export interface IRefreshSourcesModuleConfig extends ICommanderRefreshClientModuleConfig, IRefreshConfig {
}


@Module({})
export class RefreshSourcesModule {
    static forRoot(
        url: string,
        version: string
    ): DynamicModule {
        const config: IRefreshSourcesModuleConfig = {
            url,
            useragent: formatUseragent(version),
            jwt: getEnvBackendJwtConfig(),
            emptyDelay: parseInt(
                process.env.SOURCES_REFRESH_EMPTY_DELAY ?? ONE_SECOND_IN_MS.toString(),
                10
            ),
            errorDelay: parseInt(
                process.env.SOURCES_REFRESH_ERROR_DELAY ?? (2 * ONE_SECOND_IN_MS).toString(),
                10
            ),
        };

        return {
            module: RefreshSourcesModule,
            imports: [
                CommanderRefreshClientModule.forRoot(config), ScheduleModule.forRoot(),
            ],
            providers: [
                {
                    provide: REFRESH_SOURCES_CONFIG,
                    useValue: config,
                },
                RefreshSourcesService,
            ],
        };
    }
}
