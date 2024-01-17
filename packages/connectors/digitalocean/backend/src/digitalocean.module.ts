import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportCloudModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorDigitaloceanFactory } from './digitalocean.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportCloudModule,
    ],
    providers: [
        ConnectorDigitaloceanFactory,
    ],
})
export class ConnectorDigitaloceanModule {}
