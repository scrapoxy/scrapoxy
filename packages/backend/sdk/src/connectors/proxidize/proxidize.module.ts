import { Module } from '@nestjs/common';
import { ConnectorProxidizeFactory } from './proxidize.factory';
import { TransportHardwareModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportHardwareModule,
    ],
    providers: [
        ConnectorProxidizeFactory,
    ],
})
export class ConnectorProxidizeModule {}
