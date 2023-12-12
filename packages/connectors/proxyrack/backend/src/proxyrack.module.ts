import { Module } from '@nestjs/common';
import { ConnectorprovidersModule } from '@scrapoxy/backend-sdk';
import { ConnectorProxyrackFactory } from './proxyrack.factory';
import { TransportProxyrackModule } from './transport';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyrackModule,
    ],
    providers: [
        ConnectorProxyrackFactory,
    ],
})
export class ConnectorProxyrackModule {}
