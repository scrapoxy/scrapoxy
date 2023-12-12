import { Module } from '@nestjs/common';
import { ConnectorprovidersService } from './providers.service';


@Module({
    providers: [
        ConnectorprovidersService,
    ],
    exports: [
        ConnectorprovidersService,
    ],
})
export class ConnectorprovidersModule {}
