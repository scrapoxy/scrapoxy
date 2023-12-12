import {
    CONNECTOR_DATA_META,
    CONNECTOR_SYNC_META,
    CONNECTOR_VIEW_META,
} from '@scrapoxy/common';
import { toMongoMeta } from './mongo/mongo.helpers';
import type {
    ICertificate,
    IConnectorData,
    IConnectorView,
} from '@scrapoxy/common';


export interface IConnectorModel extends Omit<IConnectorView, 'id'>, Omit<IConnectorData, 'id'> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: string;

    certificate: ICertificate | null;

    nextRefreshTs: number;
}


export const
    CONNECTOR_DATA_META_MONGODB = toMongoMeta(CONNECTOR_DATA_META),
    CONNECTOR_SYNC_META_MONGODB = toMongoMeta(CONNECTOR_SYNC_META),
    CONNECTOR_VIEW_META_MONGODB = toMongoMeta(CONNECTOR_VIEW_META);
