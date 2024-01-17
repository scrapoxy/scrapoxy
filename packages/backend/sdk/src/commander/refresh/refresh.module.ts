import { Module } from '@nestjs/common';
import {
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
} from '@scrapoxy/common';
import { COMMANDER_REFRESH_MODULE_CONFIG } from './refresh.constants';
import { CommanderRefreshController } from './refresh.controller';
import { CommanderRefreshService } from './refresh.service';
import { CommanderRefreshTokenGuard } from './token.guard';
import { ConnectorprovidersModule } from '../../connectors';
import { getEnvBackendJwtConfig } from '../../helpers';
import { StorageprovidersModule } from '../../storages';
import { TasksModule } from '../../tasks';
import type { DynamicModule } from '@nestjs/common';


export interface IProxyRefreshConfig {
    delay: number;
    count: number;
}


export interface ICommanderRefreshModuleConfig {
    jwtSecret: string;
    freeproxyRefresh: IProxyRefreshConfig;
    proxyUnreachableDelay: number;
    proxyRefresh: IProxyRefreshConfig;
    stoppingDelay: number;
    clearAtShutdown: boolean;
}


export function getEnvCommanderRefreshModuleConfig(): ICommanderRefreshModuleConfig {
    const jwt = getEnvBackendJwtConfig();

    return {
        jwtSecret: jwt.secret,
        freeproxyRefresh: {
            delay: parseInt(
                process.env.FREEPROXY_REFRESH_DELAY ?? ONE_MINUTE_IN_MS.toString(),
                10
            ),
            count: parseInt(
                process.env.FREEPROXY_REFRESH_COUNT ?? '100',
                10
            ),
        },
        proxyUnreachableDelay: parseInt(
            process.env.PROXY_UNREACHABLE_DELAY ?? (10 * ONE_MINUTE_IN_MS).toString(),
            10
        ),
        proxyRefresh: {
            delay: parseInt(
                process.env.PROXY_REFRESH_DELAY ?? (10 * ONE_SECOND_IN_MS).toString(),
                10
            ),
            count: parseInt(
                process.env.PROXY_REFRESH_COUNT ?? '200',
                10
            ),
        },
        stoppingDelay: parseInt(
            process.env.STOPPING_DELAY ?? (2 * ONE_SECOND_IN_MS).toString(),
            10
        ),
        clearAtShutdown: process.env.CLEAR_AT_SHUTDOWN === 'true' || process.env.CLEAR_AT_SHUTDOWN === '1',
    };
}


@Module({})
export class CommanderRefreshModule {
    static forRoot(config: ICommanderRefreshModuleConfig): DynamicModule {
        return {
            module: CommanderRefreshModule,
            imports: [
                ConnectorprovidersModule, StorageprovidersModule, TasksModule,
            ],
            providers: [
                {
                    provide: COMMANDER_REFRESH_MODULE_CONFIG,
                    useValue: config,
                },
                CommanderRefreshService,
                CommanderRefreshTokenGuard,
            ],
            controllers: [
                CommanderRefreshController,
            ],
        };
    }

    static forRootFromEnv(): DynamicModule {
        return CommanderRefreshModule.forRoot(getEnvCommanderRefreshModuleConfig());
    }
}
