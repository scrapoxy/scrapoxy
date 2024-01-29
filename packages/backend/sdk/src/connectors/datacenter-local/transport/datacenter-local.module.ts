import { Module } from '@nestjs/common';
import { TransportDatacenterLocalService } from './datacenter-local.service';
import { TransportprovidersModule } from '../../../transports';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportDatacenterLocalService,
    ],
})
export class TransportDatacenterLocalModule {}
