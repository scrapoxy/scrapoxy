import { Module } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { StorageMongoService } from './mongo.service';
import {
    ProbeprovidersModule,
    ProbeprovidersService,
} from '../../../probe';
import type { IMongoConfig } from '../distributed.interface';
import type { DynamicModule } from '@nestjs/common';


@Module({})
export class StorageDistributedMongoModule {
    static forRoot(config: IMongoConfig): DynamicModule {
        return {
            module: StorageDistributedMongoModule,
            imports: [
                ProbeprovidersModule,
            ],
            providers: [
                {
                    provide: StorageMongoService,
                    useFactory: async(probes: ProbeprovidersService): Promise<StorageMongoService> => {
                        const client = await MongoClient.connect(config.uri);

                        return new StorageMongoService(
                            client,
                            config,
                            probes
                        );
                    },
                    inject: [
                        ProbeprovidersService,
                    ],
                },
            ],
            exports: [
                StorageMongoService,
            ],
        };
    }
}
