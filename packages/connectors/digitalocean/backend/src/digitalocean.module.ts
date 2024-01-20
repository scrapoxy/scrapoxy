import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportDatacenterModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorDigitaloceanFactory } from './digitalocean.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorDigitaloceanFactory,
    ],
})
export class ConnectorDigitaloceanModule {}
