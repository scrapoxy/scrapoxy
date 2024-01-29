import { Module } from '@nestjs/common';
import { TransportNimblewayService } from './nimbleway.service';
import { TransportprovidersModule } from '../../../transports';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportNimblewayService,
    ],
})
export class TransportNimblewayModule {}
