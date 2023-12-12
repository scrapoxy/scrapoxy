import { Module } from '@nestjs/common';
import { TransportProxyService } from './proxy.service';
import { TransportprovidersModule } from '../providers.module';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyService,
    ],
})
export class TransportProxyModule {}
