import type {
    IImageCloudlocalData,
    IImageCloudlocalToCreate,
    IImageCloudlocalToUpdate,
    IImageCloudlocalView,
} from './image/image.interface';
import type {
    IInstanceCloudlocalData,
    IInstanceCloudlocalToRemove,
    IInstanceCloudlocalView,
    IInstancesCloudlocalToCreate,
} from './instance/instance.interface';
import type {
    IRegionCloudlocal,
    IRegionSizeCloudlocal,
} from './region/region.interface';
import type {
    ISubscriptionCloudlocalData,
    ISubscriptionCloudlocalToCreate,
    ISubscriptionCloudlocalToUpdate,
    ISubscriptionCloudlocalView,
} from './subscription/subscription.interface';


export interface ICloudlocal {
    //////////// REGIONS ////////////
    getAllRegions: () => Promise<IRegionCloudlocal[]>;

    getRegion: (region: string) => Promise<IRegionCloudlocal>;

    getAllRegionSizes: (region: string) => Promise<IRegionSizeCloudlocal[]>;

    getRegionSize: (region: string, size: string) => Promise<IRegionSizeCloudlocal>;

    //////////// SUBSCRIPTIONS ////////////
    getAllSubscriptions: () => Promise<ISubscriptionCloudlocalView[]>;

    getSubscription: (subscriptionId: string) => Promise<ISubscriptionCloudlocalData>;

    createSubscription: (subscriptionToCreate: ISubscriptionCloudlocalToCreate) => Promise<ISubscriptionCloudlocalView>;

    updateSubscription: (subscriptionId: string, subscriptionToUpdate: ISubscriptionCloudlocalToUpdate) => Promise<ISubscriptionCloudlocalView>;

    removeSubscription: (subscriptionId: string) => Promise<void>;

    //////////// IMAGES ////////////
    getAllImages: (subscriptionId: string, region: string) => Promise<IImageCloudlocalView[]>;

    getImage: (subscriptionId: string, region: string, imageId: string) => Promise<IImageCloudlocalData>;

    createImage: (subscriptionId: string, region: string, imageToCreate: IImageCloudlocalToCreate) => Promise<IImageCloudlocalView>;

    updateImage: (subscriptionId: string, region: string, imageId: string, imageToUpdate: IImageCloudlocalToUpdate) => Promise<IImageCloudlocalView>;

    removeImage: (subscriptionId: string, region: string, imageId: string) => Promise<void>;

    //////////// INSTANCES ////////////
    getAllInstances: (subscriptionId: string, region: string,) => Promise<IInstanceCloudlocalView[]>;

    getInstance: (subscriptionId: string, region: string, instanceId: string) => Promise<IInstanceCloudlocalData>;

    createInstances: (subscriptionId: string, region: string, instancesToCreate: IInstancesCloudlocalToCreate) => Promise<IInstanceCloudlocalView[]>;

    removeInstances: (subscriptionId: string, region: string, instancesIds: IInstanceCloudlocalToRemove[]) => Promise<void>;
}
