import {
    CREDENTIAL_DATA_META,
    CREDENTIAL_VIEW_META,
} from '@scrapoxy/common';
import { toMongoMeta } from './mongo/mongo.helpers';
import type { ICredentialData } from '@scrapoxy/common';


export interface ICredentialModel extends Omit<ICredentialData, 'id'> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _id: string;
}


export const
    CREDENTIAL_DATA_META_MONGODB = toMongoMeta(CREDENTIAL_DATA_META),
    CREDENTIAL_VIEW_META_MONGODB = toMongoMeta(CREDENTIAL_VIEW_META);
