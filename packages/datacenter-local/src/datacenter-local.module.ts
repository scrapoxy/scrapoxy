import { Module } from '@nestjs/common';
import { DATACENTER_LOCAL_MODULE_CONFIG } from './datacenter-local.constants';
import { DatacenterLocalController } from './datacenter-local.controller';
import { DatacenterLocalService } from './datacenter-local.service';
import type { DynamicModule } from '@nestjs/common';


export interface IDatacenterLocalModuleConfig {
    filename: string | undefined;
}


@Module({})
export class DatacenterLocalModule {
    static forRoot(config: IDatacenterLocalModuleConfig): DynamicModule {
        return {
            module: DatacenterLocalModule,
            providers: [
                {
                    provide: DATACENTER_LOCAL_MODULE_CONFIG,
                    useValue: config,
                },
                DatacenterLocalService,
            ],
            controllers: [
                DatacenterLocalController,
            ],
        };
    }
}
