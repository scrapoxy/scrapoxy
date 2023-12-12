import { toImageCloudlocalData } from '../image';
import type {
    ISubscriptionCloudlocalData,
    ISubscriptionCloudlocalModel,
    ISubscriptionCloudlocalStore,
    ISubscriptionCloudlocalView,
    ISubscriptionRegionCloudlocalModel,
} from './subscription.interface';
import type { IImageCloudlocalData } from '../image';
import type { IImageCloudlocalModel } from '../image/image.interface';
import type { IInstanceCloudlocalModel } from '../instance/instance.interface';


export function toSubscriptionCloudlocalView(p: ISubscriptionCloudlocalView): ISubscriptionCloudlocalView {
    const Subscription: ISubscriptionCloudlocalView = {
        id: p.id,
    };

    return Subscription;
}


export function toSubscriptionCloudlocalData(p: ISubscriptionCloudlocalData): ISubscriptionCloudlocalData {
    const Subscription: ISubscriptionCloudlocalData = {
        id: p.id,
        instancesLimit: p.instancesLimit,
        installDelay: p.installDelay,
        startingDelay: p.startingDelay,
        stoppingDelay: p.stoppingDelay,
        transitionStartingToStarted: p.transitionStartingToStarted,
        transitionStoppingToStopped: p.transitionStoppingToStopped,
        removeForcedCount: p.removeForcedCount,
    };

    return Subscription;
}


export function fromSubscriptionCloudlocalStore(p: ISubscriptionCloudlocalStore): ISubscriptionCloudlocalModel {
    const nowTime = Date.now();
    const regions = new Map<string, ISubscriptionRegionCloudlocalModel>();
    for (const imageStore of p.images) {
        let region: ISubscriptionRegionCloudlocalModel | undefined = regions.get(imageStore.region);

        if (!region) {
            region = {
                id: imageStore.region,
                images: new Map<string, IImageCloudlocalModel>(),
                instances: new Map<string, IInstanceCloudlocalModel>(),
            };
            regions.set(
                region.id,
                region
            );
        }

        const image: IImageCloudlocalModel = {
            ...imageStore,
            lastRefreshTs: nowTime,
        };

        region.images.set(
            image.id,
            image
        );
    }

    const subscription: ISubscriptionCloudlocalModel = {
        id: p.id,
        instancesLimit: p.instancesLimit,
        installDelay: p.installDelay,
        startingDelay: p.startingDelay,
        stoppingDelay: p.stoppingDelay,
        transitionStartingToStarted: p.transitionStartingToStarted,
        transitionStoppingToStopped: p.transitionStoppingToStopped,
        regions,
        removeForcedCount: p.removeForcedCount,
    };

    return subscription;
}


export function toSubscriptionCloudlocalStore(p: ISubscriptionCloudlocalModel): ISubscriptionCloudlocalStore {
    const images: IImageCloudlocalData[] = [];
    for (const region of p.regions.values()) {
        for (const image of region.images.values()) {
            images.push(toImageCloudlocalData(image));
        }
    }

    const subscription: ISubscriptionCloudlocalStore = {
        id: p.id,
        instancesLimit: p.instancesLimit,
        installDelay: p.installDelay,
        startingDelay: p.startingDelay,
        stoppingDelay: p.stoppingDelay,
        transitionStartingToStarted: p.transitionStartingToStarted,
        transitionStoppingToStopped: p.transitionStoppingToStopped,
        images,
        removeForcedCount: p.removeForcedCount,
    };

    return subscription;
}
