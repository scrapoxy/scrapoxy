import { SOURCE_META } from '@scrapoxy/common';
import { toMongoMeta } from './mongo/mongo.helpers';
import type { ISource } from '@scrapoxy/common';


export interface ISourceModel extends Omit<ISource, 'id'> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: string;

    nextRefreshTs: number;
}


export const SOURCE_META_MONGODB = toMongoMeta(SOURCE_META);
