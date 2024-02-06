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
} from '@scrapoxy/common';


@Injectable()
export class RefreshSourcesService extends ARefresh<ISource> {
    protected readonly logger = new Logger(RefreshSourcesService.name);

    constructor(
    @Inject(REFRESH_SOURCES_CONFIG)
        config: IRefreshSourcesModuleConfig,
        private readonly commander: CommanderRefreshClientService
    ) {
        super(config);
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

        try {
            const freeproxies = await this.fetchFreeproxies(source);

            await this.commander.createFreeproxies(
                source.projectId,
                source.connectorId,
                freeproxies
            );
        } catch (err: any) {
            this.logger.error(
                err.message,
                err.stack
            );
            // TODO: update status of the source
        }
    }

    private async fetchFreeproxies(source: ISource): Promise<IFreeproxyBase[]> {
        const res = await axios.get(
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
