import { Module } from '@nestjs/common';
import { ConnectorProxyCheapResidentialFactory } from './pc-residential.factory';
import { TransportProxyCheapResidentialModule } from './transport';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyCheapResidentialModule,
    ],
    providers: [
        ConnectorProxyCheapResidentialFactory,
    ],
})
export class ConnectorProxyCheapResidentialModule {}
