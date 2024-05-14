import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportProxyNetnutService } from './netnut.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyNetnutService,
    ],
})
export class TransportNetnutModule {}
