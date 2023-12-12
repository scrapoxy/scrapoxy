import { Module } from '@nestjs/common';
import { StorageprovidersService } from './providers.service';


export function getEnvStorageType(storage?: string): string | undefined {
    return storage ?? process.env.STORAGE_TYPE;
}


@Module({
    providers: [
        StorageprovidersService,
    ],
    exports: [
        StorageprovidersService,
    ],
})
export class StorageprovidersModule {}
