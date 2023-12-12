import { ValidationError } from '@scrapoxy/backend-sdk';
import {
    ImageCloudlocalAlreadyExistsError,
    ImageCloudlocalNotFoundError,
    ImageCloudlocalRemoveError,
    InstanceCloudlocalAlreadyExistsError,
    InstanceCloudlocalCreateError,
    InstanceCloudlocalNotFoundError,
    RegionCloudlocalNotFoundError,
    RegionSizeCloudlocalNotFoundError,
    SubscriptionCloudlocalAlreadyExistsError,
    SubscriptionCloudlocalNotFoundError,
    SubscriptionCloudlocalRemoveError,
    SubscriptionRegionCloudlocalNotFoundError,
} from './client.errors';


export function catchError(data: any) {
    if (data?.id) {
        switch (data.id) {
            //////////// REGIONS ////////////
            case RegionCloudlocalNotFoundError.id: {
                throw RegionCloudlocalNotFoundError.from(data);
            }

            case RegionSizeCloudlocalNotFoundError.id: {
                throw RegionSizeCloudlocalNotFoundError.from(data);
            }

            //////////// SUBSCRIPTIONS ////////////
            case SubscriptionCloudlocalNotFoundError.id: {
                throw SubscriptionCloudlocalNotFoundError.from(data);
            }

            case SubscriptionRegionCloudlocalNotFoundError.id: {
                throw SubscriptionRegionCloudlocalNotFoundError.from(data);
            }

            case SubscriptionCloudlocalAlreadyExistsError.id: {
                throw SubscriptionCloudlocalAlreadyExistsError.from(data);
            }

            case SubscriptionCloudlocalRemoveError.id: {
                throw SubscriptionCloudlocalRemoveError.from(data);
            }

            //////////// IMAGES ////////////
            case ImageCloudlocalNotFoundError.id: {
                throw ImageCloudlocalNotFoundError.from(data);
            }

            case ImageCloudlocalAlreadyExistsError.id: {
                throw ImageCloudlocalAlreadyExistsError.from(data);
            }

            case ImageCloudlocalRemoveError.id: {
                throw ImageCloudlocalRemoveError.from(data);
            }

            //////////// INSTANCES ////////////
            case InstanceCloudlocalNotFoundError.id: {
                throw InstanceCloudlocalNotFoundError.from(data);
            }

            case InstanceCloudlocalAlreadyExistsError.id: {
                throw InstanceCloudlocalAlreadyExistsError.from(data);
            }

            case InstanceCloudlocalCreateError.id: {
                throw InstanceCloudlocalCreateError.from(data);
            }

            //////////// MISC ////////////
            case ValidationError.id: {
                throw ValidationError.from(data);
            }
        }
    }
}
