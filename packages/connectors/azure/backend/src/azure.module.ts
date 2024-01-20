import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportDatacenterModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorAzureFactory } from './azure.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorAzureFactory,
    ],
})
export class ConnectorAzureModule {}
