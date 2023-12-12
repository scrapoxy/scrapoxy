import {
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    EventsService,
    ProbeprovidersService,
    StorageprovidersService,
} from '@scrapoxy/backend-sdk';
import { STORAGE_MEMORY_MODULE_CONFIG } from './memory.constants';
import { AStorageLocal } from '../local.abstract';
import type { IStorageMemoryModuleConfig } from './memory.module';
import type { IStorageFileModuleConfig } from '../file/file.module';


@Injectable()
export class StorageMemoryService extends AStorageLocal<IStorageMemoryModuleConfig> {
    type = 'memory';

    alive = true;

    constructor(
    @Inject(STORAGE_MEMORY_MODULE_CONFIG)
        config: IStorageFileModuleConfig,
        events: EventsService,
        probes: ProbeprovidersService,
        provider: StorageprovidersService
    ) {
        super(
            config,
            events
        );

        provider.storage = this;

        probes.register(this);
    }
}
