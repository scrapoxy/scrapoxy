import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportProxyrackService } from './proxyrack.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyrackService,
    ],
})
export class TransportProxyrackModule {}
