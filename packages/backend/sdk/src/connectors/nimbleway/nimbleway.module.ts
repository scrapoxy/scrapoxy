import { Module } from '@nestjs/common';
import { ConnectorNimblewayFactory } from './nimbleway.factory';
import { TransportNimblewayModule } from './transport';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportNimblewayModule,
    ],
    providers: [
        ConnectorNimblewayFactory,
    ],
})
export class ConnectorNimblewayModule {}
