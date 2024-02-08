import { Agent as AgentHttp } from 'http';
import { Agent as AgentHttps } from 'https';
import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    ONE_MINUTE_IN_MS,
    parseFreeproxy,
} from '@scrapoxy/common';
import axios from 'axios';
import { REFRESH_SOURCES_CONFIG } from './sources.constants';
import { CommanderRefreshClientService } from '../../commander-client';
import { NoSourceToRefreshError } from '../../errors';
import { ARefresh } from '../refresh.abstract';
import type { IRefreshSourcesModuleConfig } from './sources.module';
import type {
    IFreeproxyBase,
    ISource,
    ISourceRefreshed,
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


@Injectable()
export class RefreshSourcesService extends ARefresh<ISource> {
    protected readonly logger = new Logger(RefreshSourcesService.name);

    private readonly httpInstance = new AgentHttp();

    private readonly httpsInstance = new AgentHttps({
        rejectUnauthorized: false,
    });

    private readonly instance: AxiosInstance;

    constructor(
    @Inject(REFRESH_SOURCES_CONFIG)
        config: IRefreshSourcesModuleConfig,
        private readonly commander: CommanderRefreshClientService
    ) {
        super(config);

        this.instance = axios.create({
            httpAgent: this.httpInstance,
            httpsAgent: this.httpsInstance,
        });
    }

    override onApplicationShutdown() {
        super.onApplicationShutdown();

        this.httpInstance.destroy();
        this.httpsInstance.destroy();
    }

    async next(): Promise<ISource | undefined> {
        try {
            const source = await this.commander.getNextSourceToRefresh();

            return source;
        } catch (err: any) {
            if (err instanceof NoSourceToRefreshError) {
                return;
            }

            throw err;
        }
    }

    async task(source: ISource): Promise<void> {
        this.logger.debug(`get freeproxies source url ${source.url}`);

        const nowTime = Date.now();
        try {
            const freeproxies = await this.fetchFreeproxies(source);

            if (freeproxies && freeproxies.length > 0) {
                await this.commander.createFreeproxies(
                    source.projectId,
                    source.connectorId,
                    freeproxies
                );
            }

            const refreshed: ISourceRefreshed = {
                id: source.id,
                connectorId: source.connectorId,
                projectId: source.projectId,
                lastRefreshTs: nowTime,
                lastRefreshError: null,
            };

            await this.commander.updateSource(refreshed);
        } catch (err: any) {
            const refreshed: ISourceRefreshed = {
                id: source.id,
                connectorId: source.connectorId,
                projectId: source.projectId,
                lastRefreshTs: nowTime,
                lastRefreshError: err.message,
            };

            await this.commander.updateSource(refreshed);
        }
    }

    private async fetchFreeproxies(source: ISource): Promise<IFreeproxyBase[]> {
        const res = await this.instance.get(
            source.url,
            {
                timeout: Math.min(
                    source.delay,
                    ONE_MINUTE_IN_MS
                ),
            }
        );
        const freeproxies = (res.data as string).split(/[\n,]/)
            .map((l) => l.trim())
            .map(parseFreeproxy)
            .filter((p: any) => !!p) as IFreeproxyBase[];

        return freeproxies;
    }
}
