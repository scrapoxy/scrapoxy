import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportDecodoDcService } from './decodo-dc.service';
import { TransportDecodoResidentialService } from './decodo-residential.service';
import { TransportDecodoServerService } from './decodo-server.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportDecodoDcService, TransportDecodoResidentialService, TransportDecodoServerService,
    ],
})
export class TransportDecodoModule {}
