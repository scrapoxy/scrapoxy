import { Module } from '@nestjs/common';
import { ConnectorprovidersModule } from '@scrapoxy/backend-sdk';
import { ConnectorSmartproxyFactory } from './smartproxy.factory';
import { TransportSmartproxyModule } from './transport';


@Module({
    imports: [
        ConnectorprovidersModule, TransportSmartproxyModule,
    ],
    providers: [
        ConnectorSmartproxyFactory,
    ],
})
export class ConnectorSmartproxyModule {}
