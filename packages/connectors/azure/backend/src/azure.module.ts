import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportCloudModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorAzureFactory } from './azure.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportCloudModule, TasksModule,
    ],
    providers: [
        ConnectorAzureFactory,
    ],
})
export class ConnectorAzureModule {}
