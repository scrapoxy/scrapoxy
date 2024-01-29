import { Module } from '@nestjs/common';
import { ConnectorDigitaloceanFactory } from './digitalocean.factory';
import { TasksModule } from '../../tasks';
import { TransportDatacenterModule } from '../../transports';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TasksModule, TransportDatacenterModule,
    ],
    providers: [
        ConnectorDigitaloceanFactory,
    ],
})
export class ConnectorDigitaloceanModule {}
