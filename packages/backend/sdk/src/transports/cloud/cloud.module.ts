import { Module } from '@nestjs/common';
import { TransportCloudService } from './cloud.service';
import { TransportprovidersModule } from '../providers.module';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportCloudService,
    ],
})
export class TransportCloudModule {}
