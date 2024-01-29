import { Module } from '@nestjs/common';
import { ConnectorGcpFactory } from './gcp.factory';
import { TasksModule } from '../../tasks';
import { TransportDatacenterModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorGcpFactory,
    ],
})
export class ConnectorGcpModule {}
