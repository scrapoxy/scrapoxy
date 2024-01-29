import { Module } from '@nestjs/common';
import { TransportZyteService } from './zyte.service';
import { TransportprovidersModule } from '../../../transports';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportZyteService,
    ],
})
export class TransportZyteModule {}
