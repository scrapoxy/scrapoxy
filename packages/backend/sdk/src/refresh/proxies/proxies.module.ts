import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { REFRESH_PROXIES_CONFIG } from './proxies.constants';
import { RefreshProxiesService } from './proxies.service';
import { CommanderRefreshClientModule } from '../../commander-client';
import { ConnectorprovidersModule } from '../../connectors';
import { getEnvFingerprintConfig } from '../../fingerprint';
import {
    formatUseragent,
    getEnvBackendJwtConfig,
} from '../../helpers';
import { TransportprovidersModule } from '../../transports';
import type { ICommanderRefreshClientModuleConfig } from '../../commander-client';
import type { IRefreshConfig } from '../refresh.abstract';
import type { DynamicModule } from '@nestjs/common';
import type { IFingerprintOptions } from '@scrapoxy/common';


export interface IRefreshProxiesModuleConfig extends ICommanderRefreshClientModuleConfig, IRefreshConfig {
    fingerprint: IFingerprintOptions;
    trackSockets: boolean;
}


@Module({})
export class RefreshProxiesModule {
    static forRoot(
        url: string,
        version: string,
        trackSockets: boolean,
        fingerprintUrl?: string,
        fingerprintTimeout?: number
    ): DynamicModule {
        const config: IRefreshProxiesModuleConfig = {
            url,
            useragent: formatUseragent(version),
            jwt: getEnvBackendJwtConfig(),
            emptyDelay: parseInt(
                process.env.PROXIES_REFRESH_EMPTY_DELAY ?? ONE_SECOND_IN_MS.toString(),
                10
            ),
            errorDelay: parseInt(
                process.env.PROXIES_REFRESH_ERROR_DELAY ?? (2 * ONE_SECOND_IN_MS).toString(),
                10
            ),
            fingerprint: getEnvFingerprintConfig(
                version,
                fingerprintUrl,
                fingerprintTimeout
            ),
            trackSockets,
        };

        return {
            module: RefreshProxiesModule,
            imports: [
                CommanderRefreshClientModule.forRoot(config),
                ConnectorprovidersModule,
                ScheduleModule.forRoot(),
                TransportprovidersModule,
            ],
            providers: [
                {
                    provide: REFRESH_PROXIES_CONFIG,
                    useValue: config,
                },
                RefreshProxiesService,
            ],
        };
    }
}
