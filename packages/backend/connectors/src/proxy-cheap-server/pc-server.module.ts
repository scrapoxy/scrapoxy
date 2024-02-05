import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TransportProxyModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorProxyCheapServerFactory } from './pc-server.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorProxyCheapServerFactory,
    ],
})
export class ConnectorProxyCheapServerModule {}
