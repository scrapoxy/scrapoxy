import { Module } from '@nestjs/common';
import { ConnectorProxyrackFactory } from './proxyrack.factory';
import { TransportProxyrackModule } from './transport';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyrackModule,
    ],
    providers: [
        ConnectorProxyrackFactory,
    ],
})
export class ConnectorProxyrackModule {}
