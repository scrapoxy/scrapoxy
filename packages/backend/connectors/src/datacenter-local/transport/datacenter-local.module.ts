import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportDatacenterLocalService } from './datacenter-local.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportDatacenterLocalService,
    ],
})
export class TransportDatacenterLocalModule {}
