import type {
    IImageDatacenterLocalData,
    IImageDatacenterLocalToCreate,
    IImageDatacenterLocalToUpdate,
    IImageDatacenterLocalView,
} from './image/image.interface';
import type {
    IInstanceDatacenterLocalData,
    IInstanceDatacenterLocalToRemove,
    IInstanceDatacenterLocalView,
    IInstancesDatacenterLocalToCreate,
} from './instance/instance.interface';
import type {
    IRegionDatacenterLocal,
    IRegionSizeDatacenterLocal,
} from './region/region.interface';
import type {
    ISubscriptionDatacenterLocalData,
    ISubscriptionDatacenterLocalToCreate,
    ISubscriptionDatacenterLocalToUpdate,
    ISubscriptionDatacenterLocalView,
} from './subscription/subscription.interface';


export interface IDatacenterLocal {
    //////////// REGIONS ////////////
    getAllRegions: () => Promise<IRegionDatacenterLocal[]>;

    getRegion: (region: string) => Promise<IRegionDatacenterLocal>;

    getAllRegionSizes: (region: string) => Promise<IRegionSizeDatacenterLocal[]>;

    getRegionSize: (region: string, size: string) => Promise<IRegionSizeDatacenterLocal>;

    //////////// SUBSCRIPTIONS ////////////
    getAllSubscriptions: () => Promise<ISubscriptionDatacenterLocalView[]>;

    getSubscription: (subscriptionId: string) => Promise<ISubscriptionDatacenterLocalData>;

    createSubscription: (subscriptionToCreate: ISubscriptionDatacenterLocalToCreate) => Promise<ISubscriptionDatacenterLocalView>;

    updateSubscription: (subscriptionId: string, subscriptionToUpdate: ISubscriptionDatacenterLocalToUpdate) => Promise<ISubscriptionDatacenterLocalView>;

    removeSubscription: (subscriptionId: string) => Promise<void>;

    //////////// IMAGES ////////////
    getAllImages: (subscriptionId: string, region: string) => Promise<IImageDatacenterLocalView[]>;

    getImage: (subscriptionId: string, region: string, imageId: string) => Promise<IImageDatacenterLocalData>;

    createImage: (subscriptionId: string, region: string, imageToCreate: IImageDatacenterLocalToCreate) => Promise<IImageDatacenterLocalView>;

    updateImage: (subscriptionId: string, region: string, imageId: string, imageToUpdate: IImageDatacenterLocalToUpdate) => Promise<IImageDatacenterLocalView>;

    removeImage: (subscriptionId: string, region: string, imageId: string) => Promise<void>;

    //////////// INSTANCES ////////////
    getAllInstances: (subscriptionId: string, region: string,) => Promise<IInstanceDatacenterLocalView[]>;

    getInstance: (subscriptionId: string, region: string, instanceId: string) => Promise<IInstanceDatacenterLocalData>;

    createInstances: (subscriptionId: string, region: string, instancesToCreate: IInstancesDatacenterLocalToCreate) => Promise<IInstanceDatacenterLocalView[]>;

    removeInstances: (subscriptionId: string, region: string, instancesIds: IInstanceDatacenterLocalToRemove[]) => Promise<void>;
}
