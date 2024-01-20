import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    StorageprovidersModule,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_PROXY_LOCAL_MODULE_CONFIG } from './proxy-local.constants';
import { ConnectorProxyLocalFactory } from './proxy-local.factory';
import { TransportProxyLocalModule } from './transport';
import type { DynamicModule } from '@nestjs/common';


export interface IConnectorProxyLocalModuleConfig {
    url: string;
}


@Module({
    imports: [],
})
export class ConnectorProxyLocalModule {
    static forRoot(config: IConnectorProxyLocalModuleConfig): DynamicModule {
        return {
            module: ConnectorProxyLocalModule,
            imports: [
                ConnectorprovidersModule, TransportProxyLocalModule, StorageprovidersModule,
            ],
            providers: [
                {
                    provide: CONNECTOR_PROXY_LOCAL_MODULE_CONFIG,
                    useValue: config,
                },
                ConnectorProxyLocalFactory,
            ],
        };
    }
}
