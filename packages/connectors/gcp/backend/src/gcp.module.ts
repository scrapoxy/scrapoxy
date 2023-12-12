import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportCloudModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorGcpFactory } from './gcp.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TransportCloudModule, TasksModule,
    ],
    providers: [
        ConnectorGcpFactory,
    ],
})
export class ConnectorGcpModule {}
