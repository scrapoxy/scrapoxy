import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TransportProxyModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorIproyalServerFactory } from './iproyal-server.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorIproyalServerFactory,
    ],
})
export class ConnectorIproyalServerModule {}
