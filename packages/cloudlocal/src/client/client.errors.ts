import { BadRequestException } from '@nestjs/common';


export enum ECloudlocalError {
    //////////// REGIONS ////////////
    RegionCloudlocalNotFound = 'region_cloudlocal_not_found',
    RegionSizeCloudlocalNotFound = 'region_size_cloudlocal_not_found',

    //////////// SUBSCRIPTIONS ////////////
    SubscriptionCloudlocalNotFound = 'subscription_cloudlocal_not_found',
    SubscriptionRegionCloudlocalNotFound = 'subscription_region_cloudlocal_not_found',
    SubscriptionCloudlocalAlreadyExists = 'subscription_cloudlocal_already_exists',
    SubscriptionCloudlocalRemove = 'subscription_cloudlocal_remove',

    //////////// IMAGES ////////////
    ImageCloudlocalNotFound = 'image_cloudlocal_not_found',
    ImageCloudlocalAlreadyExists = 'image_cloudlocal_already_exists',
    ImageCloudlocalRemove = 'image_cloudlocal_remove',

    //////////// INSTANCES ////////////
    InstanceCloudlocalNotFound = 'instance_cloudlocal_not_found',
    InstanceCloudlocalAlreadyExists = 'instance_cloudlocal_already_exists',
    InstanceCloudlocalCreate = 'instance_cloudlocal_create',
}


//////////// REGIONS ////////////
export class RegionCloudlocalNotFoundError extends BadRequestException {
    static readonly id = ECloudlocalError.RegionCloudlocalNotFound;

    static from(data: any): RegionCloudlocalNotFoundError {
        return new RegionCloudlocalNotFoundError(data.region);
    }

    constructor(region: string) {
        super({
            id: RegionCloudlocalNotFoundError.id,
            message: `Cannot find region (region=${region})`,
            region,
        });
    }
}


export class RegionSizeCloudlocalNotFoundError extends BadRequestException {
    static readonly id = ECloudlocalError.RegionSizeCloudlocalNotFound;

    static from(data: any): RegionSizeCloudlocalNotFoundError {
        return new RegionSizeCloudlocalNotFoundError(
            data.region,
            data.size
        );
    }

    constructor(
        region: string,
        size: string
    ) {
        super({
            id: RegionSizeCloudlocalNotFoundError.id,
            message: `Cannot find size (size=${size}) in region (region=${region})`,
            region,
            size,
        });
    }
}


//////////// SUBSCRIPTIONS ////////////
export class SubscriptionCloudlocalNotFoundError extends BadRequestException {
    static readonly id = ECloudlocalError.SubscriptionCloudlocalNotFound;

    static from(data: any): SubscriptionCloudlocalNotFoundError {
        return new SubscriptionCloudlocalNotFoundError(data.subscriptionId);
    }

    constructor(subscriptionId: string) {
        super({
            id: SubscriptionCloudlocalNotFoundError.id,
            message: `Cannot find subscription (subscriptionId=${subscriptionId})`,
            subscriptionId,
        });
    }
}


export class SubscriptionRegionCloudlocalNotFoundError extends BadRequestException {
    static readonly id = ECloudlocalError.SubscriptionRegionCloudlocalNotFound;

    static from(data: any): SubscriptionRegionCloudlocalNotFoundError {
        return new SubscriptionRegionCloudlocalNotFoundError(
            data.subscriptionId,
            data.region
        );
    }

    constructor(
        subscriptionId: string,
        region: string
    ) {
        super({
            id: SubscriptionRegionCloudlocalNotFoundError.id,
            message: `Cannot find region (region=${region}) in subscription (subscriptionId=${subscriptionId})`,
            subscriptionId,
            region,
        });
    }
}


export class SubscriptionCloudlocalAlreadyExistsError extends BadRequestException {
    static readonly id = ECloudlocalError.SubscriptionCloudlocalAlreadyExists;

    static from(data: any): SubscriptionCloudlocalAlreadyExistsError {
        return new SubscriptionCloudlocalAlreadyExistsError(data.subscriptionId);
    }

    constructor(subscriptionId: string) {
        super({
            id: SubscriptionCloudlocalAlreadyExistsError.id,
            message: `Already found subscription (subscriptionId=${subscriptionId})`,
            subscriptionId,
        });
    }
}


export class SubscriptionCloudlocalRemoveError extends BadRequestException {
    static readonly id = ECloudlocalError.SubscriptionCloudlocalRemove;

    static from(data: any): SubscriptionCloudlocalRemoveError {
        return new SubscriptionCloudlocalRemoveError(
            data.subscriptionId,
            data.reason
        );
    }

    constructor(
        subscriptionId: string,
        reason: string
    ) {
        super({
            id: SubscriptionCloudlocalRemoveError.id,
            message: `Cannot remove subscription (subscriptionId=${subscriptionId}): ${reason}`,
            subscriptionId,
            reason,
        });
    }
}


//////////// IMAGES ////////////
export class ImageCloudlocalNotFoundError extends BadRequestException {
    static readonly id = ECloudlocalError.ImageCloudlocalNotFound;

    static from(data: any): ImageCloudlocalNotFoundError {
        return new ImageCloudlocalNotFoundError(
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
            id: ImageCloudlocalNotFoundError.id,
            message: `Cannot find image (imageId=${imageId}) in subscription (subscriptionId=${subscriptionId}, region=${region})`,
            subscriptionId,
            region,
            imageId,
        });
    }
}


export class ImageCloudlocalAlreadyExistsError extends BadRequestException {
    static readonly id = ECloudlocalError.ImageCloudlocalAlreadyExists;

    static from(data: any): ImageCloudlocalAlreadyExistsError {
        return new ImageCloudlocalAlreadyExistsError(
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
            id: ImageCloudlocalAlreadyExistsError.id,
            message: `Already found image (imageId=${imageId}) in subscription (subscriptionId=${subscriptionId}, region=${region})`,
            subscriptionId,
            region,
            imageId,
        });
    }
}


export class ImageCloudlocalRemoveError extends BadRequestException {
    static readonly id = ECloudlocalError.ImageCloudlocalRemove;

    static from(data: any): ImageCloudlocalRemoveError {
        return new ImageCloudlocalRemoveError(
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
            id: ImageCloudlocalRemoveError.id,
            message: `Cannot remove image (imageId=${imageId}) in subscription (subscriptionId=${subscriptionId}, region=(${region}): ${reason}`,
            subscriptionId,
            region,
            imageId,
            reason,
        });
    }
}


//////////// INSTANCES ////////////
export class InstanceCloudlocalNotFoundError extends BadRequestException {
    static readonly id = ECloudlocalError.InstanceCloudlocalNotFound;

    static from(data: any): InstanceCloudlocalNotFoundError {
        return new InstanceCloudlocalNotFoundError(
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
            id: InstanceCloudlocalNotFoundError.id,
            message: `Cannot find instance (instanceId=${instanceId}) in subscription (subscriptionId=${subscriptionId}, region=${region})`,
            subscriptionId,
            region,
            instanceId,
        });
    }
}


export class InstanceCloudlocalAlreadyExistsError extends BadRequestException {
    static readonly id = ECloudlocalError.InstanceCloudlocalAlreadyExists;

    static from(data: any): InstanceCloudlocalAlreadyExistsError {
        return new InstanceCloudlocalAlreadyExistsError(
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
            id: InstanceCloudlocalAlreadyExistsError.id,
            message: `Already found instance (instanceId=${instanceId}) in subscription (subscriptionId=${subscriptionId}; region=${region})`,
            subscriptionId,
            region,
            instanceId,
        });
    }
}


export class InstanceCloudlocalCreateError extends BadRequestException {
    static readonly id = ECloudlocalError.InstanceCloudlocalCreate;

    static from(data: any): InstanceCloudlocalCreateError {
        return new InstanceCloudlocalCreateError(
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
            id: InstanceCloudlocalCreateError.id,
            message: `Cannot create instance in subscription (subscriptionId=${subscriptionId}, region=${region}): ${reason}`,
            subscriptionId,
            region,
            reason,
        });
    }
}
