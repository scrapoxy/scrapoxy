import { Module } from '@nestjs/common';
import { COMMANDER_FRONTEND_MODULE_CONFIG } from './frontend.constants';
import { CommanderFrontendController } from './frontend.controller';
import { CommanderFrontendService } from './frontend.service';
import { CommanderFrontendRoleGuard } from './role.guard';
import { CommanderFrontendTokenGuard } from './token.guard';
import { AuthprovidersModule } from '../../auths';
import { ConnectorprovidersModule } from '../../connectors';
import { getEnvFingerprintConfig } from '../../fingerprint';
import { getEnvFrontendJwtConfig } from '../../helpers';
import { StorageprovidersModule } from '../../storages';
import { TasksModule } from '../../tasks';
import { TransportprovidersModule } from '../../transports';
import type { IJwtConfig } from '../../helpers';
import type { DynamicModule } from '@nestjs/common';
import type { IFingerprintOptions } from '@scrapoxy/common';


export interface ICommanderFrontendModuleConfig {
    jwt: IJwtConfig;
    fingerprint: IFingerprintOptions;
}


@Module({})
export class CommanderFrontendModule {
    static forRoot(fingerprintUrl?: string): DynamicModule {
        const config: ICommanderFrontendModuleConfig = {
            jwt: getEnvFrontendJwtConfig(),
            fingerprint: getEnvFingerprintConfig(fingerprintUrl),
        };

        return {
            module: CommanderFrontendModule,
            imports: [
                AuthprovidersModule,
                ConnectorprovidersModule,
                TransportprovidersModule,
                TasksModule,
                StorageprovidersModule,
            ],
            providers: [
                {
                    provide: COMMANDER_FRONTEND_MODULE_CONFIG,
                    useValue: config,
                },
                CommanderFrontendService,
                CommanderFrontendRoleGuard,
                CommanderFrontendTokenGuard,
            ],
            controllers: [
                CommanderFrontendController,
            ],
        };
    }
}
