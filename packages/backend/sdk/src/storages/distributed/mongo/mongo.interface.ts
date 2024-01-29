import {
    Db,
    MongoClient,
} from 'mongodb';
import type { IMongoConfig } from '../distributed.interface';


export interface IMongoConnection {
    config: IMongoConfig;
    client: MongoClient;
    db: Db;
}
