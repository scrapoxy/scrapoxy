import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { REFRESH_METRICS_CONFIG } from './metrics.constants';
import { RefreshMetricsService } from './metrics.service';
import { CommanderRefreshClientModule } from '../../commander-client';
import { getEnvBackendJwtConfig } from '../../helpers';
import type { IRefreshMetricsConfig } from './metrics.service';
import type { ICommanderRefreshClientModuleConfig } from '../../commander-client';
import type { DynamicModule } from '@nestjs/common';


export interface IRefreshMetricsModuleConfig extends ICommanderRefreshClientModuleConfig, IRefreshMetricsConfig {}


@Module({})
export class RefreshMetricsModule {
    static forRoot(
        url: string, refreshDelay?: number
    ): DynamicModule {
        const config: IRefreshMetricsModuleConfig = {
            url,
            jwt: getEnvBackendJwtConfig(),
            refreshDelay: refreshDelay ?? parseInt(
                process.env.METRICS_REFRESH_REFRESH_DELAY ?? (10 * ONE_SECOND_IN_MS).toString(),
                10
            ),
            errorDelay: refreshDelay ? refreshDelay * 2 : parseInt(
                process.env.REFRESH_METRICS_ERROR_DELAY ?? (20 * ONE_SECOND_IN_MS).toString(),
                10
            ),
        };

        return {
            module: RefreshMetricsModule,
            imports: [
                CommanderRefreshClientModule.forRoot(config), ScheduleModule.forRoot(),
            ],
            providers: [
                {
                    provide: REFRESH_METRICS_CONFIG,
                    useValue: config,
                },
                RefreshMetricsService,
            ],
        };
    }
}
