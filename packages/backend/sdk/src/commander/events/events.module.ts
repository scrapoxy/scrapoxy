import { Module } from '@nestjs/common';
import { COMMANDER_EVENTS_MODULE_CONFIG } from './events.constants';
import { CommanderEventsGateway } from './events.gateway';
import { EventsModule } from '../../events';
import { getEnvFrontendJwtConfig } from '../../helpers';
import type { DynamicModule } from '@nestjs/common';


export interface ICommanderEventsModuleConfig {
    jwtSecret: string;
}


@Module({})
export class CommanderEventsModule {
    static forRoot(): DynamicModule {
        const jwt = getEnvFrontendJwtConfig();
        const config: ICommanderEventsModuleConfig = {
            jwtSecret: jwt.secret,
        };

        return {
            module: CommanderEventsModule,
            imports: [
                EventsModule,
            ],
            providers: [
                {
                    provide: COMMANDER_EVENTS_MODULE_CONFIG,
                    useValue: config,
                },
                CommanderEventsGateway,
            ],
        };
    }
}
