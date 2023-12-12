import { Module } from '@nestjs/common';
import { PROBE_MODULE_CONFIG } from './probe.constants';
import { ProbeService } from './probe.service';
import { ProbeprovidersModule } from './providers';
import type { DynamicModule } from '@nestjs/common';


export interface IProbeModuleConfig {
    port: number;
}


export function getEnvProbeModuleConfig(): IProbeModuleConfig {
    return {
        port: parseInt(
            process.env.PROBE_PORT ?? '8887',
            10
        ),
    };
}


@Module({})
export class ProbeModule {
    static forRoot(config: IProbeModuleConfig): DynamicModule {
        return {
            module: ProbeModule,
            imports: [
                ProbeprovidersModule,
            ],
            providers: [
                {
                    provide: PROBE_MODULE_CONFIG,
                    useValue: config,
                },
                ProbeService,
            ],
        };
    }

    static forRootFromEnv(): DynamicModule {
        const config: IProbeModuleConfig = getEnvProbeModuleConfig();

        return ProbeModule.forRoot(config);
    }
}
