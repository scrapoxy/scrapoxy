import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportIproyalResidentialService } from './iproyal-residential.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportIproyalResidentialService,
    ],
})
export class TransportIproyalResidentialModule {}
