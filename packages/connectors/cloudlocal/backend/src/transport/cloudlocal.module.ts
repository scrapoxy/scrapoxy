import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportCloudlocalService } from './cloudlocal.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportCloudlocalService,
    ],
})
export class TransportCloudlocalModule {}
