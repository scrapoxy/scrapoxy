import { Timeout } from '@nestjs/schedule';
import { sleep } from '@scrapoxy/common';
import type {
    LoggerService,
    OnApplicationShutdown,
} from '@nestjs/common';


export interface IRefreshConfig {
    emptyDelay: number;
    errorDelay: number;
}


export abstract class ARefresh<T> implements OnApplicationShutdown {
    protected abstract readonly logger: LoggerService;

    private running = true;

    constructor(private readonly refreshConfig: IRefreshConfig) {}

    abstract next(): Promise<T | undefined>;

    abstract task(t: T): Promise<void>;

    @Timeout(0)
    async execute() {
        while (this.running) {
            try {
                const item = await this.next();

                if (!this.running) {
                    break;
                }

                if (item) {
                    await this.task(item);
                } else {
                    await sleep(this.refreshConfig.emptyDelay);
                }
            } catch (err: any) {
                this.logger.error(
                    err,
                    err.stack
                );

                if (!this.running) {
                    break;
                }

                await sleep(this.refreshConfig.errorDelay);
            }
        }
    }

    onApplicationShutdown() {
        this.running = false;
    }
}
