import { Test } from '@nestjs/testing';
import { AuthLocalModule } from '@scrapoxy/auth-local';
import {
    Agents,
    AStorageLocal,
    CommanderEventsModule,
    CommanderFrontendClient,
    CommanderFrontendModule,
    CommanderMasterModule,
    CommanderRefreshModule,
    CommanderScraperModule,
    CommanderUsersModule,
    ConnectorDatacenterLocalModule,
    ConnectorProxyLocalModule,
    LogExceptionFilter,
    ScrapoxyExpressAdapter,
    StorageprovidersService,
} from '@scrapoxy/backend-sdk';
import { EventsService } from '@scrapoxy/common';
import { CommanderUsersClient } from '../commander-users-client';
import { USERAGENT_TEST } from '../info';
import { buildStorageModules } from '../storageproviders.helpers';
import type {
    DynamicModule,
    ForwardReference,
    INestApplication,
    LoggerService,
    Type,
} from '@nestjs/common';
import type {
    IProxyTest,
    IStorageLocalModuleConfig,
} from '@scrapoxy/backend-sdk';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { AddressInfo } from 'net';


export interface ICommanderAppOptions {
    datacenterLocalAppUrl?: string;
    fingerprintUrl?: string;
    fingerprintTimeout?: number;
    imports?: (Type | DynamicModule | Promise<DynamicModule> | ForwardReference)[];
    logger: LoggerService;
    proxyLocalAppUrl?: string;

}


export class CommanderApp {
    public static defaults(options: ICommanderAppOptions): CommanderApp {
        options.imports = options.imports ?? [];

        options.imports.push(
            AuthLocalModule.forRoot({
                test: true,
            }),
            CommanderEventsModule.forRoot(),
            CommanderMasterModule.forRoot(),
            CommanderRefreshModule.forRootFromEnv(),
            CommanderScraperModule,
            CommanderUsersModule.forRoot()
        );

        if (options.fingerprintUrl) {
            options.imports.push(CommanderFrontendModule.forRoot(options.fingerprintUrl));
        }

        return new CommanderApp(options);
    }

    private readonly agents = new Agents();

    private app: INestApplication | undefined = void 0;

    private commanderFrontendClient: ICommanderFrontendClient | undefined = void 0;

    private commanderUsersClient: CommanderUsersClient | undefined = void 0;

    private eventsService: EventsService | undefined = void 0;

    constructor(private readonly options: ICommanderAppOptions) {
    }

    get port(): number {
        if (!this.app) {
            throw new Error('app not initialized');
        }

        const address = this.app.getHttpServer()
            .address() as AddressInfo;

        return address.port;
    }

    get url(): string {
        return `http://localhost:${this.port}/api`;
    }

    get eventsUrl(): string {
        return `http://localhost:${this.port}/`;
    }

    get frontendClient(): ICommanderFrontendClient {
        if (!this.commanderFrontendClient) {
            throw new Error('frontendClient not initialized');
        }

        return this.commanderFrontendClient;
    }

    get usersClient(): CommanderUsersClient {
        if (!this.commanderUsersClient) {
            throw new Error('commanderUsersClient not initialized');
        }

        return this.commanderUsersClient;
    }

    get events(): EventsService {
        if (!this.eventsService) {
            throw new Error('eventsService not initialized');
        }

        return this.eventsService;
    }

    async start(): Promise<void> {
        const storageModules = buildStorageModules();
        const imports: (Type | DynamicModule | Promise<DynamicModule> | ForwardReference)[] = [
            ...storageModules.modules, ...this.options.imports ?? [],
        ];

        if (this.options.datacenterLocalAppUrl) {
            imports.push(ConnectorDatacenterLocalModule.forRoot({
                url: this.options.datacenterLocalAppUrl,
            }));
        }

        if (this.options.proxyLocalAppUrl) {
            imports.push(ConnectorProxyLocalModule.forRoot({
                url: this.options.proxyLocalAppUrl,
            }));
        }

        const moduleRef = await Test.createTestingModule({
            imports,
        })
            .setLogger(this.options.logger)
            .compile();

        await storageModules.reset(moduleRef);

        this.app = moduleRef.createNestApplication(new ScrapoxyExpressAdapter());
        this.app.enableShutdownHooks();
        this.app.useGlobalFilters(new LogExceptionFilter());
        await storageModules.connect(this.app);
        await this.app.listen(0);

        this.commanderUsersClient = await CommanderUsersClient.generateUser(
            this.url,
            USERAGENT_TEST
        );

        this.commanderFrontendClient = new CommanderFrontendClient(
            this.url,
            USERAGENT_TEST,
            this.commanderUsersClient.jwtToken,
            this.agents
        );

        this.eventsService = new EventsService();
        await this.eventsService.connect(
            this.eventsUrl,
            this.commanderUsersClient.jwtToken
        );
    }

    async stop(): Promise<void> {
        this.events.disconnect();

        if (this.app) {
            await this.app.close();
        }

        this.agents.close();
    }

    initFakesProxies(
        projectId: string,
        connectorId: string,
        proxies: IProxyTest[]
    ) {
        if (!this.app) {
            throw new Error('app not initialized');
        }

        const providers = this.app.get<StorageprovidersService>(StorageprovidersService);
        const storage = providers.storage as AStorageLocal<IStorageLocalModuleConfig>;

        storage.initProxies(
            projectId,
            connectorId,
            proxies
        );
    }
}
