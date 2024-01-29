import { Module } from '@nestjs/common';
import { TransportProxyCheapResidentialService } from './pc-residential.service';
import { TransportprovidersModule } from '../../../transports';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyCheapResidentialService,
    ],
})
export class TransportProxyCheapResidentialModule {}
