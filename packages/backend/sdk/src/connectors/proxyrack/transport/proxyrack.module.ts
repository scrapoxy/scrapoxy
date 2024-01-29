import { Module } from '@nestjs/common';
import { TransportProxyrackService } from './proxyrack.service';
import { TransportprovidersModule } from '../../../transports';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportProxyrackService,
    ],
})
export class TransportProxyrackModule {}
