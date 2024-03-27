import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportBrightdataService } from './brightdata.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportBrightdataService,
    ],
})
export class TransportBrightdataModule {}
