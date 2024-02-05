import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportProxyLocalService } from './proxy-local.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyLocalService,
    ],
})
export class TransportProxyLocalModule {}
