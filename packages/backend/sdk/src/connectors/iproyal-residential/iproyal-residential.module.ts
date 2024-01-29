import { Module } from '@nestjs/common';
import { ConnectorIproyalResidentialFactory } from './iproyal-residential.factory';
import { TransportIproyalResidentialModule } from './transport';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportIproyalResidentialModule,
    ],
    providers: [
        ConnectorIproyalResidentialFactory,
    ],
})
export class ConnectorIproyalResidentialModule {}
