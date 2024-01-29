import { Module } from '@nestjs/common';
import { ConnectorFreeproxiesFactory } from './freeproxies.factory';
import { TransportProxyModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorFreeproxiesFactory,
    ],
})
export class ConnectorFreeproxiesModule {}
