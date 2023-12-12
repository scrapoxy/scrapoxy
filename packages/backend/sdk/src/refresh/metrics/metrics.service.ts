import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { sleep } from '@scrapoxy/common';
import { REFRESH_METRICS_CONFIG } from './metrics.constants';
import { CommanderRefreshClientService } from '../../commander-client';
import type { IRefreshMetricsModuleConfig } from './metrics.module';
import type { OnApplicationShutdown } from '@nestjs/common';


export interface IRefreshMetricsConfig {
    refreshDelay: number;
    errorDelay: number;
}


@Injectable()
export class RefreshMetricsService implements OnApplicationShutdown {
    private readonly logger = new Logger(RefreshMetricsService.name);

    private running = true;

    constructor(
        @Inject(REFRESH_METRICS_CONFIG)
        private readonly config: IRefreshMetricsModuleConfig,
        private readonly commander: CommanderRefreshClientService
    ) {}

    @Timeout(0)
    async execute() {
        while (this.running) {
            try {
                await this.commander.refreshProjectMetrics();

                if (!this.running) {
                    break;
                }

                await sleep(this.config.refreshDelay);
            } catch (err: any) {
                this.logger.error(
                    err,
                    err.stack
                );

                if (!this.running) {
                    break;
                }

                await sleep(this.config.errorDelay);
            }
        }
    }

    onApplicationShutdown() {
        this.running = false;
    }
}
