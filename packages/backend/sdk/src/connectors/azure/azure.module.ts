import { Module } from '@nestjs/common';
import { ConnectorAzureFactory } from './azure.factory';
import { TasksModule } from '../../tasks';
import { TransportDatacenterModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorAzureFactory,
    ],
})
export class ConnectorAzureModule {}
