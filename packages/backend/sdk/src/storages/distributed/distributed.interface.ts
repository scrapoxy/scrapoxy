export interface IMongoConfig {
    uri: string;
    db: string;
    certificatesCollectionSizeInBytes: number;
}


export interface IRabbitMqConfig {
    uri: string;
    queueOrders: string;
    queueEvents: string;
}


export interface IStorageDistributedModuleConfig {
    mongo: IMongoConfig;
    rabbitmq: IRabbitMqConfig;
}
