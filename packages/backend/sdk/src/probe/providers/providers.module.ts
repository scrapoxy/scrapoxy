import { Module } from '@nestjs/common';
import { ProbeprovidersService } from './providers.service';


@Module({
    providers: [
        ProbeprovidersService,
    ],
    exports: [
        ProbeprovidersService,
    ],
})
export class ProbeprovidersModule {}
