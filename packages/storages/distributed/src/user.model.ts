import {
    USER_DATA_META,
    USER_PROJECT_META,
    USER_VIEW_META,
} from '@scrapoxy/common';
import { toMongoMeta } from './mongo/mongo.helpers';
import type { IUserData } from '@scrapoxy/common';


export interface IUserModel extends Omit<IUserData, 'id'> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: string;
    projectsIds: string[];
}


export const
    USER_DATA_META_MONGODB = toMongoMeta(USER_DATA_META),
    USER_PROJECT_META_MONGODB = toMongoMeta(USER_PROJECT_META),
    USER_VIEW_META_MONGODB = toMongoMeta(USER_VIEW_META);
