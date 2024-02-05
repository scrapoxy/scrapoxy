import { Module } from '@nestjs/common';
import {
    ConnectorprovidersModule,
    TasksModule,
    TransportDatacenterModule,
} from '@scrapoxy/backend-sdk';
import { ConnectorAwsFactory } from './aws.factory';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorAwsFactory,
    ],
})
export class ConnectorAwsModule {}
