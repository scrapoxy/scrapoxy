import { Module } from '@nestjs/common';
import {
    ClientsModule,
    Transport,
} from '@nestjs/microservices';
import { ProbeprovidersModule } from '@scrapoxy/backend-sdk';
import { StorageDistributedMsController } from './ms.controller';
import { DISTRIBUTED_MS_SERVICE } from '../distributed.constants';
import { getEnvStorageDistributedModuleConfig } from '../distributed.helpers';
import { StorageDistributedMongoModule } from '../mongo';
import type { DynamicModule } from '@nestjs/common';


@Module({})
export class StorageDistributedMsModule {
    static forRoot(): DynamicModule {
        const config = getEnvStorageDistributedModuleConfig();

        return {
            module: StorageDistributedMsModule,
            imports: [
                // Send item on the 'events' queue with ClientProxy instance
                ClientsModule.register([
                    {
                        name: DISTRIBUTED_MS_SERVICE,
                        transport: Transport.RMQ,
                        options: {
                            urls: [
                                config.rabbitmq.uri,
                            ],
                            queue: config.rabbitmq.queueEvents,
                            queueOptions: {
                                durable: false,
                            },
                        },
                    },
                ]),
                ProbeprovidersModule,
                StorageDistributedMongoModule.forRoot(config.mongo),
            ],
            controllers: [
                StorageDistributedMsController,
            ],
        };
    }
}
