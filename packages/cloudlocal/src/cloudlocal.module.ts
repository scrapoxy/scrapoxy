import { Module } from '@nestjs/common';
import { CLOUDLOCAL_MODULE_CONFIG } from './cloudlocal.constants';
import { CloudlocalController } from './cloudlocal.controller';
import { CloudlocalService } from './cloudlocal.service';
import type { DynamicModule } from '@nestjs/common';


export interface ICloudlocalModuleConfig {
    filename: string | undefined;
}


@Module({})
export class CloudlocalModule {
    static forRoot(config: ICloudlocalModuleConfig): DynamicModule {
        return {
            module: CloudlocalModule,
            providers: [
                {
                    provide: CLOUDLOCAL_MODULE_CONFIG,
                    useValue: config,
                },
                CloudlocalService,
            ],
            controllers: [
                CloudlocalController,
            ],
        };
    }
}
