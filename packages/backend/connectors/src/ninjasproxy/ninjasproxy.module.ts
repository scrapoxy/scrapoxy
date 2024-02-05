import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TransportProxyModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorNinjasproxyFactory } from './ninjasproxy.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorNinjasproxyFactory,
    ],
})
export class ConnectorNinjasproxyModule {}
