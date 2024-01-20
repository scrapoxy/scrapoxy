import { NestFactory } from '@nestjs/core';
import {
    Agents,
    ScrapoxyExpressAdapter,
} from '@scrapoxy/backend-sdk';
import { DatacenterLocalClient } from '../client';
import { DatacenterLocalModule } from '../datacenter-local.module';
import { DatacenterLocalService } from '../datacenter-local.service';
import type{ IProxyTest } from '../datacenter-local.interface';
import type {
    INestApplication,
    LoggerService,
} from '@nestjs/common';
import type { IProxy } from '@scrapoxy/proxy-sdk';
import type { AddressInfo } from 'net';


export class DatacenterLocalApp {
    public client!: DatacenterLocalClient;

    private app!: INestApplication;

    private readonly agents = new Agents();

    constructor(
        private readonly logger: LoggerService,
        private readonly filename?: string
    ) {}

    get port(): number {
        const address = this.app.getHttpServer()
            .address() as AddressInfo;

        return address.port;
    }

    get url(): string {
        return `http://localhost:${this.port}/api`;
    }

    async start(): Promise<void> {
        const app = await NestFactory.create(
            DatacenterLocalModule.forRoot({
                filename: this.filename,
            }),
            new ScrapoxyExpressAdapter(),
            {
                logger: this.logger,
            }
        );
        app.enableShutdownHooks();
        app.setGlobalPrefix('/api');
        await app.listen(0);

        this.app = app;
        this.client = new DatacenterLocalClient(
            this.url,
            this.agents
        );
    }

    async close(): Promise<void> {
        await this.app.close();

        this.agents.close();
    }

    getFakeProxies(
        subscriptionId: string,
        region: string
    ): IProxyTest[] {
        const service = this.app.get<DatacenterLocalService>(DatacenterLocalService);

        return service.getFakeProxies(
            subscriptionId,
            region
        );
    }

    async initFakeProxies(
        subscriptionId: string,
        region: string,
        size: string,
        imageId: string,
        proxies: IProxyTest[]
    ): Promise<void> {
        const service = this.app.get<DatacenterLocalService>(DatacenterLocalService);

        await service.initFakeProxies(
            subscriptionId,
            region,
            size,
            imageId,
            proxies
        );
    }

    getAllInstancesProxies(
        subscriptionId: string,
        region: string
    ): IProxy[] {
        const service = this.app.get<DatacenterLocalService>(DatacenterLocalService);

        return service.getAllInstancesProxies(
            subscriptionId,
            region
        );
    }
}
