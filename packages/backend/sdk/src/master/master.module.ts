import { Module } from '@nestjs/common';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { MASTER_MODULE_CONFIG } from './master.constants';
import { MasterService } from './master.service';
import {
    CommanderMasterClientModule,
    CommanderRefreshClientModule,
    getEnvCommanderMasterClientModuleConfig,
    getEnvCommanderRefreshClientModuleConfig,
} from '../commander-client';
import { ConnectorprovidersModule } from '../connectors';
import { formatUseragent } from '../helpers';
import { TransportprovidersModule } from '../transports';
import type {
    ICommanderMasterClientModuleConfig,
    ICommanderRefreshClientModuleConfig,
} from '../commander-client';
import type { DynamicModule } from '@nestjs/common';
import type { ICertificate } from '@scrapoxy/common';


export interface IMasterRefreshClientModuleConfig extends ICommanderRefreshClientModuleConfig {
    delay: number;
}


export interface IMasterModuleConfig {
    port: number;
    certificate: ICertificate | undefined;
    master: ICommanderMasterClientModuleConfig;
    refreshMetrics: IMasterRefreshClientModuleConfig;
    trackSockets: boolean;
}


@Module({})
export class MasterModule {
    static forRoot(config: IMasterModuleConfig): DynamicModule {
        return {
            module: MasterModule,
            imports: [
                CommanderMasterClientModule.forRoot(config.master),
                CommanderRefreshClientModule.forRoot(config.refreshMetrics),
                ConnectorprovidersModule,
                TransportprovidersModule,
            ],
            providers: [
                {
                    provide: MASTER_MODULE_CONFIG,
                    useValue: config,
                },
                MasterService,
            ],
        };
    }

    static forRootFromEnv(
        url: string,
        version: string,
        trackSockets: boolean,
        port?: number,
        refreshDelay?: number
    ): DynamicModule {
        const refreshMetrics = getEnvCommanderRefreshClientModuleConfig(
            url,
            formatUseragent(version)
        ) as IMasterRefreshClientModuleConfig;
        refreshMetrics.delay = refreshDelay ?? parseInt(
            process.env.MASTER_REFRESH_METRICS_DELAY ?? (10 * ONE_SECOND_IN_MS).toString(10),
            10
        );

        const
            certificateCert = process.env.MASTER_CERTIFICATE_CERT,
            certificateKey = process.env.MASTER_CERTIFICATE_KEY;
        let certificate: ICertificate | undefined;

        if (certificateCert && certificateCert.length >= 0 &&
            certificateKey && certificateKey.length >= 0) {
            certificate = {
                cert: certificateCert,
                key: certificateKey,
            };
        } else {
            certificate = void 0;
        }

        const config: IMasterModuleConfig = {
            port: port !== void 0 ? port : parseInt(
                process.env.MASTER_PORT ?? '8888',
                10
            ),
            certificate,
            master: getEnvCommanderMasterClientModuleConfig(
                url,
                version
            ),
            refreshMetrics,
            trackSockets,
        };

        return MasterModule.forRoot(config);
    }
}
