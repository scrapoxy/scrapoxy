import { Module } from '@nestjs/common';
import { ConnectorXProxyFactory } from './xproxy.factory';
import { TransportHardwareModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportHardwareModule,
    ],
    providers: [
        ConnectorXProxyFactory,
    ],
})
export class ConnectorXProxyModule {}
