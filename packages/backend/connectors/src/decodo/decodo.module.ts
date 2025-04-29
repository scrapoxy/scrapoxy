import { Module } from '@nestjs/common';
import { ConnectorprovidersModule } from '@scrapoxy/backend-sdk';
import { ConnectorDecodoFactory } from './decodo.factory';
import { TransportDecodoModule } from './transport';


@Module({
    imports: [
        ConnectorprovidersModule, TransportDecodoModule,
    ],
    providers: [
        ConnectorDecodoFactory,
    ],
})
export class ConnectorDecodoModule {}
