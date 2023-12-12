import { Module } from '@nestjs/common';
import { TransportHarwareService } from './hardware.service';
import { TransportprovidersModule } from '../providers.module';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportHarwareService,
    ],
})
export class TransportHardwareModule {}
