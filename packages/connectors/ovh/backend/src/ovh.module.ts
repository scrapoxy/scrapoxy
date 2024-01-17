import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportCloudModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorOvhFactory } from './ovh.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportCloudModule,
    ],
    providers: [
        ConnectorOvhFactory,
    ],
})
export class ConnectorOvhModule {}
