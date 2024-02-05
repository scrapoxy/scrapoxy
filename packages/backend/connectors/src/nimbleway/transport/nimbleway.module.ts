import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportNimblewayService } from './nimbleway.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportNimblewayService,
    ],
})
export class TransportNimblewayModule {}
