import { ValidationError } from '@scrapoxy/backend-sdk';
import {
    DatacenterLocalNotFoundError,
    ImageDatacenterLocalAlreadyExistsError,
    ImageDatacenterLocalRemoveError,
    InstanceDatacenterLocalAlreadyExistsError,
    InstanceDatacenterLocalCreateError,
    InstanceDatacenterLocalNotFoundError,
    RegionDatacenterLocalNotFoundError,
    RegionSizeDatacenterLocalNotFoundError,
    SubscriptionDatacenterLocalAlreadyExistsError,
    SubscriptionDatacenterLocalNotFoundError,
    SubscriptionDatacenterLocalRemoveError,
    SubscriptionRegionDatacenterLocalNotFoundError,
} from './client.errors';


export function catchError(data: any) {
    if (data?.id) {
        switch (data.id) {
            //////////// REGIONS ////////////
            case RegionDatacenterLocalNotFoundError.id: {
                throw RegionDatacenterLocalNotFoundError.from(data);
            }

            case RegionSizeDatacenterLocalNotFoundError.id: {
                throw RegionSizeDatacenterLocalNotFoundError.from(data);
            }

            //////////// SUBSCRIPTIONS ////////////
            case SubscriptionDatacenterLocalNotFoundError.id: {
                throw SubscriptionDatacenterLocalNotFoundError.from(data);
            }

            case SubscriptionRegionDatacenterLocalNotFoundError.id: {
                throw SubscriptionRegionDatacenterLocalNotFoundError.from(data);
            }

            case SubscriptionDatacenterLocalAlreadyExistsError.id: {
                throw SubscriptionDatacenterLocalAlreadyExistsError.from(data);
            }

            case SubscriptionDatacenterLocalRemoveError.id: {
                throw SubscriptionDatacenterLocalRemoveError.from(data);
            }

            //////////// IMAGES ////////////
            case DatacenterLocalNotFoundError.id: {
                throw DatacenterLocalNotFoundError.from(data);
            }

            case ImageDatacenterLocalAlreadyExistsError.id: {
                throw ImageDatacenterLocalAlreadyExistsError.from(data);
            }

            case ImageDatacenterLocalRemoveError.id: {
                throw ImageDatacenterLocalRemoveError.from(data);
            }

            //////////// INSTANCES ////////////
            case InstanceDatacenterLocalNotFoundError.id: {
                throw InstanceDatacenterLocalNotFoundError.from(data);
            }

            case InstanceDatacenterLocalAlreadyExistsError.id: {
                throw InstanceDatacenterLocalAlreadyExistsError.from(data);
            }

            case InstanceDatacenterLocalCreateError.id: {
                throw InstanceDatacenterLocalCreateError.from(data);
            }

            //////////// MISC ////////////
            case ValidationError.id: {
                throw ValidationError.from(data);
            }
        }
    }
}
