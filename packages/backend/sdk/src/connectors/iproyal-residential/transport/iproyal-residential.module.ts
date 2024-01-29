import { Module } from '@nestjs/common';
import { TransportIproyalResidentialService } from './iproyal-residential.service';
import { TransportprovidersModule } from '../../../transports';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportIproyalResidentialService,
    ],
})
export class TransportIproyalResidentialModule {}
