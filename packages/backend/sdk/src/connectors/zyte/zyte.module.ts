import { Module } from '@nestjs/common';
import { TransportZyteModule } from './transport';
import { ConnectorZyteFactory } from './zyte.factory';
import { ConnectorprovidersModule } from '../providers.module';


@Module({
    imports: [
        ConnectorprovidersModule, TransportZyteModule,
    ],
    providers: [
        ConnectorZyteFactory,
    ],
})
export class ConnectorZyteModule {}
