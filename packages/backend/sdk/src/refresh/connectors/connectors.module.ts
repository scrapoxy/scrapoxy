import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { REFRESH_CONNECTORS_MODULE_CONFIG } from './connectors.constants';
import { RefreshConnectorsService } from './connectors.service';
import { CommanderRefreshClientModule } from '../../commander-client';
import { ConnectorprovidersModule } from '../../connectors';
import { getEnvBackendJwtConfig } from '../../helpers';
import { TransportprovidersModule } from '../../transports';
import type { ICommanderRefreshClientModuleConfig } from '../../commander-client';
import type { IRefreshConfig } from '../refresh.abstract';
import type { DynamicModule } from '@nestjs/common';


export interface IRefreshConnectorsModuleConfig extends ICommanderRefreshClientModuleConfig, IRefreshConfig {}


@Module({})
export class RefreshConnectorsModule {
    static forRoot(url: string): DynamicModule {
        const config: IRefreshConnectorsModuleConfig = {
            url,
            jwt: getEnvBackendJwtConfig(),
            emptyDelay: parseInt(
                process.env.CONNECTORS_REFRESH_EMPTY_DELAY ?? ONE_SECOND_IN_MS.toString(),
                10
            ),
            errorDelay: parseInt(
                process.env.CONNECTORS_REFRESH_ERROR_DELAY ?? (2 * ONE_SECOND_IN_MS).toString(),
                10
            ),
        };

        return {
            module: RefreshConnectorsModule,
            imports: [
                ConnectorprovidersModule,
                CommanderRefreshClientModule.forRoot(config),
                TransportprovidersModule,
                ScheduleModule.forRoot(),
            ],
            providers: [
                {
                    provide: REFRESH_CONNECTORS_MODULE_CONFIG,
                    useValue: config,
                },
                RefreshConnectorsService,
            ],
        };
    }
}
