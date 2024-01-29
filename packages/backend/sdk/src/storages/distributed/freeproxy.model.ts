import { FREEPROXY_META } from '@scrapoxy/common';
import { toMongoMeta } from './mongo/mongo.helpers';
import type { IFreeproxy } from '@scrapoxy/common';


export interface IFreeproxyModel extends Omit<IFreeproxy, 'id'> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: string;

    nextRefreshTs: number;
}


export const FREEPROXY_META_MONGODB = toMongoMeta(FREEPROXY_META);
