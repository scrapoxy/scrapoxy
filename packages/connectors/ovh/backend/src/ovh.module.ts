import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportDatacenterModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorOvhFactory } from './ovh.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorOvhFactory,
    ],
})
export class ConnectorOvhModule {}
