import { Module } from '@nestjs/common';
import { TransportProxyLocalService } from './proxy-local.service';
import { TransportprovidersModule } from '../../../transports';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyLocalService,
    ],
})
export class TransportProxyLocalModule {}
