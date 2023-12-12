import { Module } from '@nestjs/common';
import { CommanderUsersDispatchGuard } from './dispatch.guard';
import { CommanderUsersTokenGuard } from './token.guard';
import { COMMANDER_USERS_MODULE_CONFIG } from './users.constants';
import { CommanderUsersController } from './users.controller';
import { CommanderUsersService } from './users.service';
import { AuthprovidersModule } from '../../auths';
import { getEnvFrontendJwtConfig } from '../../helpers';
import { StorageprovidersModule } from '../../storages';
import type { IJwtConfig } from '../../helpers';
import type { DynamicModule } from '@nestjs/common';


export interface ICommanderUsersModuleConfig {
    jwt: IJwtConfig;
}


@Module({})
export class CommanderUsersModule {
    static forRoot(): DynamicModule {
        const config: ICommanderUsersModuleConfig = {
            jwt: getEnvFrontendJwtConfig(),
        };

        return {
            module: CommanderUsersModule,
            imports: [
                AuthprovidersModule, StorageprovidersModule,
            ],
            providers: [
                {
                    provide: COMMANDER_USERS_MODULE_CONFIG,
                    useValue: config,
                },
                CommanderUsersService,
                CommanderUsersDispatchGuard,
                CommanderUsersTokenGuard,
            ],
            controllers: [
                CommanderUsersController,
            ],
        };
    }
}
