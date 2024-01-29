import { Module } from '@nestjs/common';
import { ConnectorProxyCheapServerFactory } from './pc-server.factory';
import { TransportProxyModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorProxyCheapServerFactory,
    ],
})
export class ConnectorProxyCheapServerModule {}
