import { Module } from '@nestjs/common';
import { ConnectorprovidersModule } from '@scrapoxy/backend-sdk';
import { ConnectorMassiveFactory } from './massive.factory';
import { TransportMassiveResidentialModule } from './transport';


@Module({
    imports: [
        ConnectorprovidersModule, TransportMassiveResidentialModule,
    ],
    providers: [
        ConnectorMassiveFactory,
    ],
})
export class ConnectorMassiveModule {}
