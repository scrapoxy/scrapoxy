import { Module } from '@nestjs/common';
import { AuthprovidersService } from './providers.service';


@Module({
    providers: [
        AuthprovidersService,
    ],
    exports: [
        AuthprovidersService,
    ],
})
export class AuthprovidersModule {}
