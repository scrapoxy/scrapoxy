import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TransportHardwareModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorProxidizeFactory } from './proxidize.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportHardwareModule,
    ],
    providers: [
        ConnectorProxidizeFactory,
    ],
})
export class ConnectorProxidizeModule {}
