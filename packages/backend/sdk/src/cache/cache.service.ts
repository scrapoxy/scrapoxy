import { Injectable } from '@nestjs/common';
import type { ICacheElement } from './cache.interface';


export class Cache {
    constructor(
        private readonly store: Map<string, ICacheElement>,
        private readonly timeout: number
    ) {
    }

    get(key: string): any | undefined {
        const cached = this.store.get(key);

        if (cached) {
            if (Date.now() - cached.timestamp < this.timeout) {
                return cached.data;
            } else {
                this.store.delete(key);

                return void 0;
            }
        } else {
            return void 0;
        }
    }

    set(
        key: string, data: any
    ): void {
        this.store.set(
            key,
            {
                data, timestamp: Date.now(),
            }
        );
    }
}


@Injectable()
export class CacheService {
    private readonly cache: Map<string, ICacheElement> = new Map();

    getCache(timeout: number): Cache {
        return new Cache(
            this.cache,
            timeout
        );
    }
}
