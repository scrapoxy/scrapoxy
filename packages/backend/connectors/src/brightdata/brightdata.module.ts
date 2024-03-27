import { Module } from '@nestjs/common';
import { ConnectorprovidersModule } from '@scrapoxy/backend-sdk';
import { ConnectorBrightdataFactory } from './brightdata.factory';
import { TransportBrightdataModule } from './transport';


@Module({
    imports: [
        ConnectorprovidersModule, TransportBrightdataModule,
    ],
    providers: [
        ConnectorBrightdataFactory,
    ],
})
export class ConnectorBrightdataModule {}
