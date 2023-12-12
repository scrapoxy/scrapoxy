import { Module } from '@nestjs/common';
import { COMMANDER_MASTER_CLIENT_MODULE_CONFIG } from './client.constants';
import { CommanderMasterClientService } from './client.service';
import { getEnvBackendJwtConfig } from '../../helpers';
import type { IJwtConfig } from '../../helpers';
import type { DynamicModule } from '@nestjs/common';


export interface ICommanderMasterClientModuleConfig {
    url: string;
    jwt: IJwtConfig;
}


export function getEnvCommanderMasterClientModuleConfig(commanderUrl: string): ICommanderMasterClientModuleConfig {
    return {
        url: commanderUrl,
        jwt: getEnvBackendJwtConfig(),
    };
}


@Module({})
export class CommanderMasterClientModule {
    static forRoot(config: ICommanderMasterClientModuleConfig): DynamicModule {
        return {
            module: CommanderMasterClientModule,
            providers: [
                {
                    provide: COMMANDER_MASTER_CLIENT_MODULE_CONFIG,
                    useValue: config,
                },
                CommanderMasterClientService,
            ],
            exports: [
                CommanderMasterClientService,
            ],
        };
    }
}
