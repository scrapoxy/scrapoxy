import { Module } from '@nestjs/common';
import { ConnectorRayobyteFactory } from './rayobyte.factory';
import { TransportProxyModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyModule,
    ],
    providers: [
        ConnectorRayobyteFactory,
    ],
})
export class ConnectorRayobyteModule {}
