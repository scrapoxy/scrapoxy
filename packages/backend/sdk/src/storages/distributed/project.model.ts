import {
    PROJECT_DATA_META,
    PROJECT_METRICS_META,
    PROJECT_SYNC_META,
    PROJECT_VIEW_META,
} from '@scrapoxy/common';
import { toMongoMeta } from './mongo/mongo.helpers';
import type {
    IProjectData,
    IProjectMetrics,
    IProjectView,
} from '@scrapoxy/common';


export interface IProjectModel extends Omit<IProjectView, 'id'>, Omit<IProjectData, 'id'>, Omit<IProjectMetrics, 'id'>{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: string;

    token: string;

    usersIds: string[];

    lastDataTs: number;
}


export const
    PROJECT_DATA_META_MONGODB = toMongoMeta(PROJECT_DATA_META),
    PROJECT_METRICS_META_MONGODB = toMongoMeta(PROJECT_METRICS_META),
    PROJECT_SYNC_META_MONGODB = toMongoMeta(PROJECT_SYNC_META),
    PROJECT_VIEW_META_MONGODB = toMongoMeta(PROJECT_VIEW_META);
