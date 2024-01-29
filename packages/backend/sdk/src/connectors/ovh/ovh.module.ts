import { Module } from '@nestjs/common';
import { ConnectorOvhFactory } from './ovh.factory';
import { TasksModule } from '../../tasks';
import { TransportDatacenterModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorOvhFactory,
    ],
})
export class ConnectorOvhModule {}
