import { Module } from '@nestjs/common';
import {
    ClientsModule,
    Transport,
} from '@nestjs/microservices';
import {
    EventsModule,
    ProbeprovidersModule,
    StorageprovidersModule,
} from '@scrapoxy/backend-sdk';
import { StorageDistributedConnController } from './conn.controller';
import { StorageDistributedConnService } from './conn.service';
import { DISTRIBUTED_SERVICE } from '../distributed.constants';
import { getEnvStorageDistributedModuleConfig } from '../distributed.helpers';
import { StorageDistributedMongoModule } from '../mongo';
import type { DynamicModule } from '@nestjs/common';


@Module({})
export class StorageDistributedConnModule {
    static forRoot(): DynamicModule {
        const config = getEnvStorageDistributedModuleConfig();

        return {
            module: StorageDistributedConnModule,
            imports: [
                // Send item on the 'orders' queue with ClientProxy instance
                ClientsModule.register([
                    {
                        name: DISTRIBUTED_SERVICE,
                        transport: Transport.RMQ,
                        options: {
                            urls: [
                                config.rabbitmq.uri,
                            ],
                            queue: config.rabbitmq.queueOrders,
                            queueOptions: {
                                durable: false,
                            },
                        },
                    },
                ]),
                EventsModule,
                ProbeprovidersModule,
                StorageDistributedMongoModule.forRoot(config.mongo),
                StorageprovidersModule,
            ],
            controllers: [
                StorageDistributedConnController,
            ],
            providers: [
                StorageDistributedConnService,
            ],
        };
    }
}
