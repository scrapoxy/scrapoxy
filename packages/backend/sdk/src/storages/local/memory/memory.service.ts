import {
    Inject,
    Injectable,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { STORAGE_MEMORY_MODULE_CONFIG } from './memory.constants';
import { EventsService } from '../../../events';
import { ProbeprovidersService } from '../../../probe';
import { StorageprovidersService } from '../../providers.service';
import { AStorageLocal } from '../local.abstract';
import type { IStorageMemoryModuleConfig } from './memory.module';
import type { IStorageFileModuleConfig } from '../file/file.module';
import type { OnModuleInit } from '@nestjs/common';


@Injectable()
export class StorageMemoryService extends AStorageLocal<IStorageMemoryModuleConfig> implements OnModuleInit {
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

    onModuleInit() {
        this.params.set(
            'installId',
            uuid()
        );
    }
}
