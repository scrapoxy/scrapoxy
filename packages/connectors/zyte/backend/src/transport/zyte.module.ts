import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportZyteService } from './zyte.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportZyteService,
    ],
})
export class TransportZyteModule {}
