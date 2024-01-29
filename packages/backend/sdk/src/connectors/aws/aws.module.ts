import { Module } from '@nestjs/common';
import { ConnectorAwsFactory } from './aws.factory';
import { TasksModule } from '../../tasks';
import { TransportDatacenterModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorAwsFactory,
    ],
})
export class ConnectorAwsModule {}
