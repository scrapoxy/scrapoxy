import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { REFRESH_FREEPROXIES_CONFIG } from './freeproxies.constants';
import { RefreshFreeproxiesService } from './freeproxies.service';
import { CommanderRefreshClientModule } from '../../commander-client';
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


export interface IRefreshFreeproxiesModuleConfig extends ICommanderRefreshClientModuleConfig, IRefreshConfig {
    fingerprint: IFingerprintOptions;
}


@Module({})
export class RefreshFreeproxiesModule {
    static forRoot(
        url: string,
        version: string,
        fingerprintUrl?: string,
        fingerprintTimeout?: number
    ): DynamicModule {
        const config: IRefreshFreeproxiesModuleConfig = {
            url,
            useragent: formatUseragent(version),
            jwt: getEnvBackendJwtConfig(),
            emptyDelay: parseInt(
                process.env.FREEPROXIES_REFRESH_EMPTY_DELAY ?? ONE_SECOND_IN_MS.toString(),
                10
            ),
            errorDelay: parseInt(
                process.env.FREEPROXIES_REFRESH_ERROR_DELAY ?? (2 * ONE_SECOND_IN_MS).toString(),
                10
            ),
            fingerprint: getEnvFingerprintConfig(
                version,
                fingerprintUrl,
                fingerprintTimeout
            ),
        };

        return {
            module: RefreshFreeproxiesModule,
            imports: [
                CommanderRefreshClientModule.forRoot(config), ScheduleModule.forRoot(), TransportprovidersModule,
            ],
            providers: [
                {
                    provide: REFRESH_FREEPROXIES_CONFIG,
                    useValue: config,
                },
                RefreshFreeproxiesService,
            ],
        };
    }
}
