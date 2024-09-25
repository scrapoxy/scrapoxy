import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportZyteApiService } from './zyte-api.service';
import { TransportZyteSmartProxyManagerService } from './zyte-spm.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportZyteApiService, TransportZyteSmartProxyManagerService,
    ],
})
export class TransportZyteModule {}
