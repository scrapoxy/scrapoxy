import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { CloudlocalService } from './cloudlocal.service';
import type {
    IImageCloudlocalData,
    IImageCloudlocalToCreate,
    IImageCloudlocalToUpdate,
    IImageCloudlocalView,
    IInstanceCloudlocalData,
    IInstanceCloudlocalToRemove,
    IInstanceCloudlocalView,
    IInstancesCloudlocalToCreate,
    IRegionCloudlocal,
    IRegionSizeCloudlocal,
    ISubscriptionCloudlocalData,
    ISubscriptionCloudlocalToCreate,
    ISubscriptionCloudlocalToUpdate,
    ISubscriptionCloudlocalView,
} from '@scrapoxy/connector-cloudlocal-sdk';


@Controller()
export class CloudlocalController {
    constructor(private readonly cloud: CloudlocalService) {}

    //////////// REGIONS ////////////
    @Get('/regions')
    async getAllRegions(): Promise<IRegionCloudlocal[]> {
        const regions = await this.cloud.getAllRegions();

        return regions;
    }

    @Get('/regions/:region')
    async getRegion(@Param('region') region: string): Promise<IRegionCloudlocal> {
        const regionFound = await this.cloud.getRegion(region);

        return regionFound;
    }


    @Get('/regions/:region/sizes')
    async getAllRegionSizes(@Param('region') region: string): Promise<IRegionSizeCloudlocal[]> {
        const sizes = await this.cloud.getAllRegionSizes(region);

        return sizes;
    }

    @Get('/regions/:region/sizes/:size')
    async getRegionSize(
        @Param('region') region: string,
            @Param('size') size: string
    ): Promise<IRegionSizeCloudlocal> {
        const sizeFound = await this.cloud.getRegionSize(
            region,
            size
        );

        return sizeFound;
    }

    //////////// SUBSCRIPTIONS ////////////
    @Get('/subscriptions')
    async getAllSubscriptions(): Promise<ISubscriptionCloudlocalView[]> {
        const subscriptions = await this.cloud.getAllSubscriptions();

        return subscriptions;
    }

    @Get('/subscriptions/:subscriptionId')
    async getSubscription(@Param('subscriptionId') subscriptionId: string): Promise<ISubscriptionCloudlocalData> {
        const subscription = await this.cloud.getSubscription(subscriptionId);

        return subscription;
    }

    @Post('/subscriptions')
    async createSubscription(@Body() subscriptionToCreate: ISubscriptionCloudlocalToCreate): Promise<ISubscriptionCloudlocalView> {
        const subscription = await this.cloud.createSubscription(subscriptionToCreate);

        return subscription;
    }

    @Put('/subscriptions/:subscriptionId')
    async updateSubscription(
        @Param('subscriptionId') subscriptionId: string,
            @Body() subscriptionToUpdate: ISubscriptionCloudlocalToUpdate
    ): Promise<ISubscriptionCloudlocalView> {
        const subscription = await this.cloud.updateSubscription(
            subscriptionId,
            subscriptionToUpdate
        );

        return subscription;
    }

    @Delete('/subscriptions/:subscriptionId')
    @HttpCode(204)
    async removeSubscription(@Param('subscriptionId') subscriptionId: string): Promise<void> {
        await this.cloud.removeSubscription(subscriptionId);
    }

    //////////// IMAGES ////////////
    @Get('/subscriptions/:subscriptionId/regions/:region/images')
    async getAllImages(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string
    ): Promise<IImageCloudlocalView[]> {
        const images = await this.cloud.getAllImages(
            subscriptionId,
            region
        );

        return images;
    }

    @Get('/subscriptions/:subscriptionId/regions/:region/images/:imageId')
    async getImage(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string,
            @Param('imageId') imageId: string
    ): Promise<IImageCloudlocalData> {
        const image = await this.cloud.getImage(
            subscriptionId,
            region,
            imageId
        );

        return image;
    }

    @Post('/subscriptions/:subscriptionId/regions/:region/images')
    async createImage(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string,
            @Body() imageToCreate: IImageCloudlocalToCreate
    ): Promise<IImageCloudlocalView> {
        const image = await this.cloud.createImage(
            subscriptionId,
            region,
            imageToCreate
        );

        return image;
    }

    @Put('/subscriptions/:subscriptionId/regions/:region/images/:imageId')
    async updateImage(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string,
            @Param('imageId') imageId: string,
            @Body() imageToUpdate: IImageCloudlocalToUpdate
    ): Promise<IImageCloudlocalView> {
        const image = await this.cloud.updateImage(
            subscriptionId,
            region,
            imageId,
            imageToUpdate
        );

        return image;
    }

    @Delete('/subscriptions/:subscriptionId/regions/:region/images/:imageId')
    @HttpCode(204)
    async removeImage(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string,
            @Param('imageId') imageId: string
    ): Promise<void> {
        await this.cloud.removeImage(
            subscriptionId,
            region,
            imageId
        );
    }

    //////////// INSTANCES ////////////
    @Get('/subscriptions/:subscriptionId/regions/:region/instances')
    async getAllInstances(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string
    ): Promise<IInstanceCloudlocalView[]> {
        const instances = await this.cloud.getAllInstances(
            subscriptionId,
            region
        );

        return instances;
    }

    @Get('/subscriptions/:subscriptionId/regions/:region/instances/:instanceId')
    async getInstance(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string,
            @Param('instanceId') instanceId: string
    ): Promise<IInstanceCloudlocalData> {
        const instance = await this.cloud.getInstance(
            subscriptionId,
            region,
            instanceId
        );

        return instance;
    }

    @Post('/subscriptions/:subscriptionId/regions/:region/instances/create')
    async createInstances(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string,
            @Body() instancesToCreate: IInstancesCloudlocalToCreate
    ): Promise<IInstanceCloudlocalView[]> {
        const instances = await this.cloud.createInstances(
            subscriptionId,
            region,
            instancesToCreate
        );

        return instances;
    }

    @Post('/subscriptions/:subscriptionId/regions/:region/instances/remove')
    async removeInstances(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string,
            @Body() instancesIds: IInstanceCloudlocalToRemove[]
    ): Promise<void> {
        await this.cloud.removeInstances(
            subscriptionId,
            region,
            instancesIds
        );
    }
}
