import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportCloudModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorAzureFactory } from './azure.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportCloudModule,
    ],
    providers: [
        ConnectorAzureFactory,
    ],
})
export class ConnectorAzureModule {}
