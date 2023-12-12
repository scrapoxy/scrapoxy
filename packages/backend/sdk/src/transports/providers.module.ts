import { Module } from '@nestjs/common';
import { TransportprovidersService } from './providers.service';


@Module({
    providers: [
        TransportprovidersService,
    ],
    exports: [
        TransportprovidersService,
    ],
})
export class TransportprovidersModule {}
