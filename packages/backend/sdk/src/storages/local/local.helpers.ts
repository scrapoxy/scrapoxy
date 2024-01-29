import { StorageFileModule } from './file/file.module';
import { StorageFileService } from './file/file.service';
import { StorageMemoryModule } from './memory/memory.module';
import type { IStorageModulesConfig } from '../providers.interface';
import type { INestApplicationContext } from '@nestjs/common';


export function buildStorageMemoryConfig(): IStorageModulesConfig {
    const config: IStorageModulesConfig = {
        modules: [
            StorageMemoryModule.forRoot(),
        ],
        reset: () => Promise.resolve(),
        connect: () => Promise.resolve(),
    };

    return config;
}


export function buildStorageFileConfig(): IStorageModulesConfig {
    const config: IStorageModulesConfig = {
        modules: [
            StorageFileModule.forRoot(),
        ],
        reset: async(moduleRef: INestApplicationContext) => {
            const storage = moduleRef.get<StorageFileService>(StorageFileService);
            await storage.clean();
        },
        connect: () => Promise.resolve(),
    };

    return config;
}
