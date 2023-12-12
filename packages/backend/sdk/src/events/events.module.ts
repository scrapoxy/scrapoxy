import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { StorageprovidersModule } from '../storages';


@Module({
    imports: [
        StorageprovidersModule,
    ],
    providers: [
        EventsService,
    ],
    exports: [
        EventsService,
    ],
})
export class EventsModule {}
