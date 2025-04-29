import { Module } from '@nestjs/common';
import {
    CacheModule,
    ConnectorprovidersModule,
    TransportProxyModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorIproyalServerFactory } from './iproyal-server.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule, CacheModule,
    ],
    providers: [
        ConnectorIproyalServerFactory,
    ],
})
export class ConnectorIproyalServerModule {}
