import {
    PROXY_DATA_META,
    PROXY_SYNC_META,
    PROXY_TO_CONNECT_META,
    PROXY_VIEW_META,
} from '@scrapoxy/common';
import { toMongoMeta } from './mongo/mongo.helpers';
import type {
    IProxyData,
    IProxySync,
    IProxyView,
} from '@scrapoxy/common';


export interface IProxyModel extends Omit<IProxyData, 'id'>, Omit<IProxySync, 'id'>, Omit<IProxyView, 'id'> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: string;

    nextRefreshTs: number;

    lastConnectionTs: number;
}


export const
    PROXY_DATA_META_MONGODB = toMongoMeta(PROXY_DATA_META),
    PROXY_SYNC_META_MONGODB = toMongoMeta(PROXY_SYNC_META),
    PROXY_TO_CONNECT_META_MONGODB = toMongoMeta(PROXY_TO_CONNECT_META),
    PROXY_VIEW_META_MONGODB = toMongoMeta(PROXY_VIEW_META);
