import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TransportProxyModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorIproyalFactory } from './iproyal.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorIproyalFactory,
    ],
})
export class ConnectorIproyalModule {}
