import { Module } from '@nestjs/common';
import { ConnectorIproyalServerFactory } from './iproyal-server.factory';
import { TransportProxyModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorIproyalServerFactory,
    ],
})
export class ConnectorIproyalServerModule {}
