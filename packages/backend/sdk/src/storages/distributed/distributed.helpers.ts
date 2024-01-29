import { Transport } from '@nestjs/microservices';
import { StorageDistributedConnModule } from './connector';
import { StorageMongoService } from './mongo';
import { StorageDistributedMsModule } from './ms';
import type { IStorageDistributedModuleConfig } from './distributed.interface';
import type { IStorageModulesConfig } from '../providers.interface';
import type {
    INestApplication,
    INestApplicationContext,
} from '@nestjs/common';


export function getEnvStorageDistributedModuleConfig(): IStorageDistributedModuleConfig {
    return {
        mongo: {
            uri: process.env.STORAGE_DISTRIBUTED_MONGO_URI ?? 'mongodb://user:password@localhost',
            db: process.env.STORAGE_DISTRIBUTED_MONGO_DB ?? 'scrapoxy',
            certificatesCollectionSizeInBytes: parseInt(
                process.env.STORAGE_DISTRIBUTED_MONGO_CERTIFICATES_SZ ?? '268435456', // 256 MB
                10
            ),
        },
        rabbitmq: {
            uri: process.env.STORAGE_DISTRIBUTED_RABBITMQ_URI ?? 'amqp://user:password@localhost:5672',
            queueOrders: process.env.STORAGE_DISTRIBUTED_RABBITMQ_QUEUE_ORDERS ?? 'scrapoxyorders',
            queueEvents: process.env.STORAGE_DISTRIBUTED_RABBITMQ_QUEUE_EVENTS ?? 'scrapoxyevents',
        },
    };
}


export function buildStorageDistributedConfig(): IStorageModulesConfig {
    const config = getEnvStorageDistributedModuleConfig();
    const configProvider: IStorageModulesConfig = {
        modules: [
            StorageDistributedConnModule.forRoot(), StorageDistributedMsModule.forRoot(),
        ],
        reset: async(moduleRef: INestApplicationContext) => {
            const storage = moduleRef.get<StorageMongoService>(StorageMongoService);
            await storage.clean();
        },
        connect: async(app: INestApplication) => {
            app.connectMicroservice({
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
            });
            app.connectMicroservice({
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
            });
            await app.startAllMicroservices();
        },
    };

    return configProvider;
}
