import { StorageFileModule } from './file';
import { StorageFileService } from './file/file.service';
import { StorageMemoryModule } from './memory';
import type { INestApplicationContext } from '@nestjs/common';
import type { IStorageModulesConfig } from '@scrapoxy/backend-sdk';


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
