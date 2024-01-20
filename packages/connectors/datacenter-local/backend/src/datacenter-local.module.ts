import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    StorageprovidersModule,
    TasksModule,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_DATACENTER_LOCAL_MODULE_CONFIG } from './datacenter-local.constants';
import { ConnectorDatacenterLocalFactory } from './datacenter-local.factory';
import { TransportDatacenterLocalModule } from './transport';
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
