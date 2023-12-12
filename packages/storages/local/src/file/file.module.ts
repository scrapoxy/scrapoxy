import { Module } from '@nestjs/common';
import {
    EventsModule,
    ProbeprovidersModule,
    StorageprovidersModule,
} from '@scrapoxy/backend-sdk';
import { STORAGE_FILE_MODULE_CONFIG } from './file.constants';
import { StorageFileService } from './file.service';
import type { IStorageLocalModuleConfig } from '../local.interface';
import type { DynamicModule } from '@nestjs/common';


export interface IStorageFileModuleConfig extends IStorageLocalModuleConfig {
    filename: string;
}


@Module({})
export class StorageFileModule {
    static forRoot(): DynamicModule {
        const config: IStorageFileModuleConfig = {
            certificatesMax: parseInt(
                process.env.STORAGE_FILE_CERTIFICATES_MAX ?? '1000',
                0
            ),
            filename: process.env.STORAGE_FILE_FILENAME ?? 'scrapoxy.json',
        };

        return {
            module: StorageFileModule,
            imports: [
                EventsModule, ProbeprovidersModule, StorageprovidersModule,
            ],
            providers: [
                {
                    provide: STORAGE_FILE_MODULE_CONFIG,
                    useValue: config,
                },
                StorageFileService,
            ],
        };
    }
}
