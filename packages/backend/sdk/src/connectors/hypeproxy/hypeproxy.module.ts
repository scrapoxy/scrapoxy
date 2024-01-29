import { Module } from '@nestjs/common';
import { ConnectorHypeproxyFactory } from './hypeproxy.factory';
import { TransportProxyModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorHypeproxyFactory,
    ],
})
export class ConnectorHypeproxyModule {}
