import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportMassiveResidentialService } from './massive.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportMassiveResidentialService,
    ],
})
export class TransportMassiveResidentialModule {}
