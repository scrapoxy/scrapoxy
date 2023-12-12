import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportProxylocalService } from './proxylocal.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxylocalService,
    ],
})
export class TransportProxylocalModule {}
