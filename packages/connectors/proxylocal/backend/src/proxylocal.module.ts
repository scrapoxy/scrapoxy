import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    StorageprovidersModule,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_PROXYLOCAL_MODULE_CONFIG } from './proxylocal.constants';
import { ConnectorProxylocalFactory } from './proxylocal.factory';
import { TransportProxylocalModule } from './transport';
import type { DynamicModule } from '@nestjs/common';


export interface IConnectorProxylocalModuleConfig {
    url: string;
}


@Module({
    imports: [],
})
export class ConnectorProxylocalModule {
    static forRoot(config: IConnectorProxylocalModuleConfig): DynamicModule {
        return {
            module: ConnectorProxylocalModule,
            imports: [
                ConnectorprovidersModule, TransportProxylocalModule, StorageprovidersModule,
            ],
            providers: [
                {
                    provide: CONNECTOR_PROXYLOCAL_MODULE_CONFIG,
                    useValue: config,
                },
                ConnectorProxylocalFactory,
            ],
        };
    }
}
