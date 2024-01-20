import { Module } from '@nestjs/common';
import { TransportDatacenterService } from './datacenter.service';
import { TransportprovidersModule } from '../providers.module';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportDatacenterService,
    ],
})
export class TransportDatacenterModule {}
