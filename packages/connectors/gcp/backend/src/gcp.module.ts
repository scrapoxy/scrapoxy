import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportDatacenterModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorGcpFactory } from './gcp.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorGcpFactory,
    ],
})
export class ConnectorGcpModule {}
