import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportProxyCheapResidentialService } from './pc-residential.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyCheapResidentialService,
    ],
})
export class TransportProxyCheapResidentialModule {}
