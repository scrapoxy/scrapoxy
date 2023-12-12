import { Injectable } from '@nestjs/common';
import type { IStorageService } from './providers.interface';


@Injectable()
export class StorageprovidersService {
    private storageValue: IStorageService | undefined = void 0;

    get storage(): IStorageService {
        if (!this.storageValue) {
            throw new Error('Storage not set');
        }

        return this.storageValue;
    }

    set storage(value: IStorageService) {
        this.storageValue = value;
    }
}
