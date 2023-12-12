import { Module } from '@nestjs/common';
import { COMMANDER_REFRESH_CLIENT_MODULE_CONFIG } from './client.constants';
import { CommanderRefreshClientService } from './client.service';
import { getEnvBackendJwtConfig } from '../../helpers';
import type { IJwtConfig } from '../../helpers';
import type { DynamicModule } from '@nestjs/common';


export interface ICommanderRefreshClientModuleConfig {
    url: string;
    jwt: IJwtConfig;
}


export function getEnvCommanderRefreshClientModuleConfig(commanderUrl: string): ICommanderRefreshClientModuleConfig {
    return {
        url: commanderUrl,
        jwt: getEnvBackendJwtConfig(),
    };
}


@Module({})
export class CommanderRefreshClientModule {
    static forRoot(config: ICommanderRefreshClientModuleConfig): DynamicModule {
        return {
            module: CommanderRefreshClientModule,
            providers: [
                {
                    provide: COMMANDER_REFRESH_CLIENT_MODULE_CONFIG,
                    useValue: config,
                },
                CommanderRefreshClientService,
            ],
            exports: [
                CommanderRefreshClientService,
            ],
        };
    }
}
