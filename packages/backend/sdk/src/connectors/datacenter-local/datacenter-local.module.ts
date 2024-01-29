import { Module } from '@nestjs/common';
import { CONNECTOR_DATACENTER_LOCAL_MODULE_CONFIG } from './datacenter-local.constants';
import { ConnectorDatacenterLocalFactory } from './datacenter-local.factory';
import { TransportDatacenterLocalModule } from './transport';
import { StorageprovidersModule } from '../../storages';
import { TasksModule } from '../../tasks';
import { ConnectorprovidersModule } from '../providers.module';
import type { DynamicModule } from '@nestjs/common';


export interface IConnectorDatacenterLocalModuleConfig {
    url: string;
}


@Module({
    imports: [],
})
export class ConnectorDatacenterLocalModule {
    static forRoot(config: IConnectorDatacenterLocalModuleConfig): DynamicModule {
        return {
            module: ConnectorDatacenterLocalModule,
            imports: [
                ConnectorprovidersModule,
                StorageprovidersModule,
                TasksModule,
                TransportDatacenterLocalModule,
            ],
            providers: [
                {
                    provide: CONNECTOR_DATACENTER_LOCAL_MODULE_CONFIG,
                    useValue: config,
                },
                ConnectorDatacenterLocalFactory,
            ],
        };
    }
}
