import {
    buildStorageDistributedConfig,
    buildStorageFileConfig,
    buildStorageMemoryConfig,
    getEnvStorageType,
} from '@scrapoxy/backend-sdk';
import type { IStorageModulesConfig } from '@scrapoxy/backend-sdk';


export function buildStorageModules(): IStorageModulesConfig {
    const storageType = getEnvStorageType() ?? 'file';
    switch (storageType) {
        case 'memory': {
            return buildStorageMemoryConfig();
        }

        case 'file': {
            return buildStorageFileConfig();
        }

        case 'distributed': {
            return buildStorageDistributedConfig();
        }

        default: {
            throw new Error(`Unknown storage type: ${storageType}`);
        }
    }
}
