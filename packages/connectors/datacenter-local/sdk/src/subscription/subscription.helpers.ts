import { toImageDatacenterLocalData } from '../image';
import type {
    ISubscriptionDatacenterLocalData,
    ISubscriptionDatacenterLocalModel,
    ISubscriptionDatacenterLocalStore,
    ISubscriptionDatacenterLocalView,
    ISubscriptionRegionDatacenterLocalModel,
} from './subscription.interface';
import type { IImageDatacenterLocalData } from '../image';
import type { IImageDatacenterLocalModel } from '../image/image.interface';
import type { IInstanceDatacenterLocalModel } from '../instance/instance.interface';


export function toSubscriptionDatacenterLocalView(p: ISubscriptionDatacenterLocalView): ISubscriptionDatacenterLocalView {
    const Subscription: ISubscriptionDatacenterLocalView = {
        id: p.id,
    };

    return Subscription;
}


export function toSubscriptionDatacenterLocalData(p: ISubscriptionDatacenterLocalData): ISubscriptionDatacenterLocalData {
    const Subscription: ISubscriptionDatacenterLocalData = {
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


export function fromSubscriptionDatacenterLocalStore(p: ISubscriptionDatacenterLocalStore): ISubscriptionDatacenterLocalModel {
    const nowTime = Date.now();
    const regions = new Map<string, ISubscriptionRegionDatacenterLocalModel>();
    for (const imageStore of p.images) {
        let region: ISubscriptionRegionDatacenterLocalModel | undefined = regions.get(imageStore.region);

        if (!region) {
            region = {
                id: imageStore.region,
                images: new Map<string, IImageDatacenterLocalModel>(),
                instances: new Map<string, IInstanceDatacenterLocalModel>(),
            };
            regions.set(
                region.id,
                region
            );
        }

        const image: IImageDatacenterLocalModel = {
            ...imageStore,
            lastRefreshTs: nowTime,
        };

        region.images.set(
            image.id,
            image
        );
    }

    const subscription: ISubscriptionDatacenterLocalModel = {
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


export function toSubscriptionDatacenterLocalStore(p: ISubscriptionDatacenterLocalModel): ISubscriptionDatacenterLocalStore {
    const images: IImageDatacenterLocalData[] = [];
    for (const region of p.regions.values()) {
        for (const image of region.images.values()) {
            images.push(toImageDatacenterLocalData(image));
        }
    }

    const subscription: ISubscriptionDatacenterLocalStore = {
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
