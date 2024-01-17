import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportCloudModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorAwsFactory } from './aws.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportCloudModule,
    ],
    providers: [
        ConnectorAwsFactory,
    ],
})
export class ConnectorAwsModule {}
