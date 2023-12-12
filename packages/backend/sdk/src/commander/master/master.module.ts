import { Module } from '@nestjs/common';
import { ONE_YEAR_IN_MS } from '@scrapoxy/common';
import { COMMANDER_MASTER_MODULE_CONFIG } from './master.constants';
import { CommanderMasterController } from './master.controller';
import { CommanderMasterService } from './master.service';
import { getEnvBackendJwtConfig } from '../../helpers';
import { StorageprovidersModule } from '../../storages';
import type { DynamicModule } from '@nestjs/common';


export interface IMitmConfig {
    certificateDurationInMs: number;
}


export interface ICommanderMasterModuleConfig {
    jwtSecret: string;
    mitm: IMitmConfig;
}


@Module({})
export class CommanderMasterModule {
    static forRoot(): DynamicModule {
        const jwt = getEnvBackendJwtConfig();
        const config: ICommanderMasterModuleConfig = {
            jwtSecret: jwt.secret,
            mitm: {
                certificateDurationInMs: parseInt(
                    process.env.MITM_CERTIFICATE_DURATION ?? ONE_YEAR_IN_MS.toString(),
                    10
                ),
            },
        };

        return {
            module: CommanderMasterModule,
            imports: [
                StorageprovidersModule,
            ],
            providers: [
                {
                    provide: COMMANDER_MASTER_MODULE_CONFIG,
                    useValue: config,
                },
                CommanderMasterService,
            ],
            controllers: [
                CommanderMasterController,
            ],
        };
    }
}
