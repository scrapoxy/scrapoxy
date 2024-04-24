import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportBrightdataResidentialService } from './brightdata-residential.service';
import { TransportBrightdataServerService } from './brightdata-server.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportBrightdataResidentialService, TransportBrightdataServerService,
    ],
})
export class TransportBrightdataModule {}
