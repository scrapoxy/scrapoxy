import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TransportProxyModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorFreeproxiesFactory } from './freeproxies.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorFreeproxiesFactory,
    ],
})
export class ConnectorFreeproxiesModule {}
