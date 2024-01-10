import { Test } from '@nestjs/testing';
import {
    MasterModule,
    MasterService,
    RefreshConnectorsModule,
    RefreshFreeproxiesModule,
    RefreshMetricsModule,
    RefreshProxiesModule,
    RefreshProxiesService,
    RefreshTasksModule,
} from '@scrapoxy/backend-sdk';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { ConnectorCloudlocalModule } from '@scrapoxy/connector-cloudlocal-backend';
import { ConnectorProxylocalModule } from '@scrapoxy/connector-proxylocal-backend';
import { CommanderApp } from './commander';
import { VERSION_TEST } from '../info';
import type {
    DynamicModule,
    ForwardReference,
    INestApplication,
    LoggerService,
    Type,
} from '@nestjs/common';


export interface IMasterAppOptions {
    cloudlocalAppUrl?: string;
    commanderApp?: CommanderApp;
    fingerprintUrl?: string;
    fingerprintTimeout?: number;
    imports?: (Type | DynamicModule | Promise<DynamicModule> | ForwardReference)[];
    logger: LoggerService;
    proxylocalAppUrl?: string;
}


export class MasterApp {
    public static defaults(options: IMasterAppOptions): MasterApp {
        options.imports = options.imports ?? [];

        if (options.commanderApp) {
            options.imports.push(
                MasterModule.forRootFromEnv(
                    options.commanderApp.url,
                    VERSION_TEST,
                    true,
                    0,
                    ONE_SECOND_IN_MS

                ),
                RefreshConnectorsModule.forRoot(
                    options.commanderApp.url,
                    VERSION_TEST
                ),
                RefreshMetricsModule.forRoot(
                    options.commanderApp.url,
                    VERSION_TEST,
                    ONE_SECOND_IN_MS
                ),
                RefreshTasksModule.forRoot(
                    options.commanderApp.url,
                    VERSION_TEST
                )
            );

            if (options.fingerprintUrl) {
                options.imports.push(
                    RefreshFreeproxiesModule.forRoot(
                        options.commanderApp.url,
                        VERSION_TEST,
                        options.fingerprintUrl,
                        options.fingerprintTimeout
                    ),
                    RefreshProxiesModule.forRoot(
                        options.commanderApp.url,
                        VERSION_TEST,
                        true,
                        options.fingerprintUrl,
                        options.fingerprintTimeout
                    )
                );
            }
        }

        return new MasterApp(options);
    }

    get masterPort(): number {
        if (!this.app) {
            throw new Error('app not initialized');
        }

        return this.app.get<MasterService>(MasterService).port as number;
    }

    private app: INestApplication | undefined = void 0;

    constructor(private readonly options: IMasterAppOptions) {}

    get proxiesSocketsSize(): number {
        if (!this.app) {
            throw new Error('App is not defined');
        }

        const service = this.app.get<RefreshProxiesService>(RefreshProxiesService);

        return service.socketsSize;
    }

    async start(): Promise<void> {
        const imports: (Type | DynamicModule | Promise<DynamicModule> | ForwardReference)[] = [
            ...this.options.imports ?? [],
        ];

        if (this.options.cloudlocalAppUrl) {
            imports.push(ConnectorCloudlocalModule.forRoot({
                url: this.options.cloudlocalAppUrl,
            }));
        }

        if (this.options.proxylocalAppUrl) {
            imports.push(ConnectorProxylocalModule.forRoot({
                url: this.options.proxylocalAppUrl,
            }));
        }

        const moduleRef = await Test.createTestingModule({
            imports,
        })
            .setLogger(this.options.logger)
            .compile();

        this.app = moduleRef.createNestApplication();
        this.app.enableShutdownHooks();
        await this.app.init();
    }

    async stop(): Promise<void> {
        if (this.app) {
            await this.app.close();
        }
    }
}
