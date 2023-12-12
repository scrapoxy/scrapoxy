import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    StorageprovidersModule,
    TasksModule,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_CLOUDLOCAL_MODULE_CONFIG } from './cloudlocal.constants';
import { ConnectorCloudlocalFactory } from './cloudlocal.factory';
import { TransportCloudlocalModule } from './transport';
import type { DynamicModule } from '@nestjs/common';


export interface IConnectorCloudlocalModuleConfig {
    url: string;
}


@Module({
    imports: [],
})
export class ConnectorCloudlocalModule {
    static forRoot(config: IConnectorCloudlocalModuleConfig): DynamicModule {
        return {
            module: ConnectorCloudlocalModule,
            imports: [
                ConnectorprovidersModule,
                TransportCloudlocalModule,
                StorageprovidersModule,
                TasksModule,
            ],
            providers: [
                {
                    provide: CONNECTOR_CLOUDLOCAL_MODULE_CONFIG,
                    useValue: config,
                },
                ConnectorCloudlocalFactory,
            ],
        };
    }
}
