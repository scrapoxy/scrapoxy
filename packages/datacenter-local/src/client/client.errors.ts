import { BadRequestException } from '@nestjs/common';


export enum EDatacenterLocalError {
    //////////// REGIONS ////////////
    RegionDatacenterLocalNotFound = 'region_datacenter_local_not_found',
    RegionSizeDatacenterLocalNotFound = 'region_size_datacenter_local_not_found',

    //////////// SUBSCRIPTIONS ////////////
    SubscriptionDatacenterLocalNotFound = 'subscription_datacenter_local_not_found',
    SubscriptionRegionDatacenterLocalNotFound = 'subscription_region_datacenter_local_not_found',
    SubscriptionDatacenterLocalAlreadyExists = 'subscription_datacenter_local_already_exists',
    SubscriptionDatacenterLocalRemove = 'subscription_datacenter_local_remove',

    //////////// IMAGES ////////////
    ImageDatacenterLocalNotFound = 'image_datacenter_local_not_found',
    ImageDatacenterLocalAlreadyExists = 'image_datacenter_local_already_exists',
    ImageDatacenterLocalRemove = 'image_datacenter_local_remove',

    //////////// INSTANCES ////////////
    InstanceDatacenterLocalNotFound = 'instance_datacenter_local_not_found',
    InstanceDatacenterLocalAlreadyExists = 'instance_datacenter_local_already_exists',
    InstanceDatacenterLocalCreate = 'instance_datacenter_local_create',
}


//////////// REGIONS ////////////
export class RegionDatacenterLocalNotFoundError extends BadRequestException {
    static readonly id = EDatacenterLocalError.RegionDatacenterLocalNotFound;

    static from(data: any): RegionDatacenterLocalNotFoundError {
        return new RegionDatacenterLocalNotFoundError(data.region);
    }

    constructor(region: string) {
        super({
            id: RegionDatacenterLocalNotFoundError.id,
            message: `Cannot find region (region=${region})`,
            region,
        });
    }
}


export class RegionSizeDatacenterLocalNotFoundError extends BadRequestException {
    static readonly id = EDatacenterLocalError.RegionSizeDatacenterLocalNotFound;

    static from(data: any): RegionSizeDatacenterLocalNotFoundError {
        return new RegionSizeDatacenterLocalNotFoundError(
            data.region,
            data.size
        );
    }

    constructor(
        region: string,
        size: string
    ) {
        super({
            id: RegionSizeDatacenterLocalNotFoundError.id,
            message: `Cannot find size (size=${size}) in region (region=${region})`,
            region,
            size,
        });
    }
}


//////////// SUBSCRIPTIONS ////////////
export class SubscriptionDatacenterLocalNotFoundError extends BadRequestException {
    static readonly id = EDatacenterLocalError.SubscriptionDatacenterLocalNotFound;

    static from(data: any): SubscriptionDatacenterLocalNotFoundError {
        return new SubscriptionDatacenterLocalNotFoundError(data.subscriptionId);
    }

    constructor(subscriptionId: string) {
        super({
            id: SubscriptionDatacenterLocalNotFoundError.id,
            message: `Cannot find subscription (subscriptionId=${subscriptionId})`,
            subscriptionId,
        });
    }
}


export class SubscriptionRegionDatacenterLocalNotFoundError extends BadRequestException {
    static readonly id = EDatacenterLocalError.SubscriptionRegionDatacenterLocalNotFound;

    static from(data: any): SubscriptionRegionDatacenterLocalNotFoundError {
        return new SubscriptionRegionDatacenterLocalNotFoundError(
            data.subscriptionId,
            data.region
        );
    }

    constructor(
        subscriptionId: string,
        region: string
    ) {
        super({
            id: SubscriptionRegionDatacenterLocalNotFoundError.id,
            message: `Cannot find region (region=${region}) in subscription (subscriptionId=${subscriptionId})`,
            subscriptionId,
            region,
        });
    }
}


export class SubscriptionDatacenterLocalAlreadyExistsError extends BadRequestException {
    static readonly id = EDatacenterLocalError.SubscriptionDatacenterLocalAlreadyExists;

    static from(data: any): SubscriptionDatacenterLocalAlreadyExistsError {
        return new SubscriptionDatacenterLocalAlreadyExistsError(data.subscriptionId);
    }

    constructor(subscriptionId: string) {
        super({
            id: SubscriptionDatacenterLocalAlreadyExistsError.id,
            message: `Already found subscription (subscriptionId=${subscriptionId})`,
            subscriptionId,
        });
    }
}


export class SubscriptionDatacenterLocalRemoveError extends BadRequestException {
    static readonly id = EDatacenterLocalError.SubscriptionDatacenterLocalRemove;

    static from(data: any): SubscriptionDatacenterLocalRemoveError {
        return new SubscriptionDatacenterLocalRemoveError(
            data.subscriptionId,
            data.reason
        );
    }

    constructor(
        subscriptionId: string,
        reason: string
    ) {
        super({
            id: SubscriptionDatacenterLocalRemoveError.id,
            message: `Cannot remove subscription (subscriptionId=${subscriptionId}): ${reason}`,
            subscriptionId,
            reason,
        });
    }
}


//////////// IMAGES ////////////
export class DatacenterLocalNotFoundError extends BadRequestException {
    static readonly id = EDatacenterLocalError.ImageDatacenterLocalNotFound;

    static from(data: any): DatacenterLocalNotFoundError {
        return new DatacenterLocalNotFoundError(
            data.subscriptionId,
            data.region,
            data.imageId
        );
    }

    constructor(
        subscriptionId: string,
        region: string,
        imageId: string
    ) {
        super({
            id: DatacenterLocalNotFoundError.id,
            message: `Cannot find image (imageId=${imageId}) in subscription (subscriptionId=${subscriptionId}, region=${region})`,
            subscriptionId,
            region,
            imageId,
        });
    }
}


export class ImageDatacenterLocalAlreadyExistsError extends BadRequestException {
    static readonly id = EDatacenterLocalError.ImageDatacenterLocalAlreadyExists;

    static from(data: any): ImageDatacenterLocalAlreadyExistsError {
        return new ImageDatacenterLocalAlreadyExistsError(
            data.subscriptionId,
            data.region,
            data.imageId
        );
    }

    constructor(
        subscriptionId: string,
        region: string,
        imageId: string
    ) {
        super({
            id: ImageDatacenterLocalAlreadyExistsError.id,
            message: `Already found image (imageId=${imageId}) in subscription (subscriptionId=${subscriptionId}, region=${region})`,
            subscriptionId,
            region,
            imageId,
        });
    }
}


export class ImageDatacenterLocalRemoveError extends BadRequestException {
    static readonly id = EDatacenterLocalError.ImageDatacenterLocalRemove;

    static from(data: any): ImageDatacenterLocalRemoveError {
        return new ImageDatacenterLocalRemoveError(
            data.subscriptionId,
            data.region,
            data.imageId,
            data.reason
        );
    }

    constructor(
        subscriptionId: string,
        region: string,
        imageId: string,
        reason: string
    ) {
        super({
            id: ImageDatacenterLocalRemoveError.id,
            message: `Cannot remove image (imageId=${imageId}) in subscription (subscriptionId=${subscriptionId}, region=(${region}): ${reason}`,
            subscriptionId,
            region,
            imageId,
            reason,
        });
    }
}


//////////// INSTANCES ////////////
export class InstanceDatacenterLocalNotFoundError extends BadRequestException {
    static readonly id = EDatacenterLocalError.InstanceDatacenterLocalNotFound;

    static from(data: any): InstanceDatacenterLocalNotFoundError {
        return new InstanceDatacenterLocalNotFoundError(
            data.subscriptionId,
            data.region,
            data.instanceId
        );
    }

    constructor(
        subscriptionId: string,
        region: string,
        instanceId: string
    ) {
        super({
            id: InstanceDatacenterLocalNotFoundError.id,
            message: `Cannot find instance (instanceId=${instanceId}) in subscription (subscriptionId=${subscriptionId}, region=${region})`,
            subscriptionId,
            region,
            instanceId,
        });
    }
}


export class InstanceDatacenterLocalAlreadyExistsError extends BadRequestException {
    static readonly id = EDatacenterLocalError.InstanceDatacenterLocalAlreadyExists;

    static from(data: any): InstanceDatacenterLocalAlreadyExistsError {
        return new InstanceDatacenterLocalAlreadyExistsError(
            data.subscriptionId,
            data.region,
            data.instanceId
        );
    }

    constructor(
        subscriptionId: string,
        region: string,
        instanceId: string
    ) {
        super({
            id: InstanceDatacenterLocalAlreadyExistsError.id,
            message: `Already found instance (instanceId=${instanceId}) in subscription (subscriptionId=${subscriptionId}; region=${region})`,
            subscriptionId,
            region,
            instanceId,
        });
    }
}


export class InstanceDatacenterLocalCreateError extends BadRequestException {
    static readonly id = EDatacenterLocalError.InstanceDatacenterLocalCreate;

    static from(data: any): InstanceDatacenterLocalCreateError {
        return new InstanceDatacenterLocalCreateError(
            data.subscriptionId,
            data.region,
            data.reason
        );
    }

    constructor(
        subscriptionId: string,
        region: string,
        reason: string
    ) {
        super({
            id: InstanceDatacenterLocalCreateError.id,
            message: `Cannot create instance in subscription (subscriptionId=${subscriptionId}, region=${region}): ${reason}`,
            subscriptionId,
            region,
            reason,
        });
    }
}
