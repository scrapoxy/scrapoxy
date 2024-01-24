import { Module } from '@nestjs/common';
import { ConnectorprovidersModule } from '@scrapoxy/backend-sdk';
import { ConnectorProxyCheapResidentialFactory } from './pc-residential.factory';
import { TransportProxyCheapResidentialModule } from './transport';


@Module({
    imports: [
        ConnectorprovidersModule, TransportProxyCheapResidentialModule,
    ],
    providers: [
        ConnectorProxyCheapResidentialFactory,
    ],
})
export class ConnectorProxyCheapResidentialModule {}
