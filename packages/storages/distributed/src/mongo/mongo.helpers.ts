import { Db } from 'mongodb';
import type {
    CreateCollectionOptions,
    DropCollectionOptions,
} from 'mongodb';


export function toMongoMeta(meta: string[]): { [key: string]: number } {
    const val: { [key: string]: number } = {};
    for (const m of meta) {
        if (m === 'id') {
            val._id = 1;
        } else {
            val[ m ] = 1;
        }
    }

    return val;
}


export function fromMongo<T>(obj: any): T {
    obj.id = obj._id;
    delete obj._id;

    return obj;
}


export function safeFromMongo<T>(obj: any): T | undefined {
    if (!obj) {
        return obj;
    }

    return fromMongo<T>(obj);
}


export async function createCollectionFailsafe(
    db: Db,
    name: string,
    options?: CreateCollectionOptions
): Promise<void> {
    try {
        await db.createCollection(
            name,
            options
        );
    } catch (err: any) {
        if (err.codeName !== 'NamespaceExists') {
            throw err;
        }
    }
}


export async function dropCollectionFailsafe(
    db: Db,
    name: string,
    options?: DropCollectionOptions
): Promise<void> {
    try {
        await db.dropCollection(
            name,
            options
        );
    } catch (err: any) {
        if (err.codeName !== 'NamespaceNotFound') {
            throw err;
        }
    }
}
