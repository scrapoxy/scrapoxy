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
import { DatacenterLocalService } from './datacenter-local.service';
import type {
    IImageDatacenterLocalData,
    IImageDatacenterLocalToCreate,
    IImageDatacenterLocalToUpdate,
    IImageDatacenterLocalView,
    IInstanceDatacenterLocalData,
    IInstanceDatacenterLocalToRemove,
    IInstanceDatacenterLocalView,
    IInstancesDatacenterLocalToCreate,
    IRegionDatacenterLocal,
    IRegionSizeDatacenterLocal,
    ISubscriptionDatacenterLocalData,
    ISubscriptionDatacenterLocalToCreate,
    ISubscriptionDatacenterLocalToUpdate,
    ISubscriptionDatacenterLocalView,
} from '@scrapoxy/connector-datacenter-local-sdk';


@Controller()
export class DatacenterLocalController {
    constructor(private readonly datacenter: DatacenterLocalService) {}

    //////////// REGIONS ////////////
    @Get('/regions')
    async getAllRegions(): Promise<IRegionDatacenterLocal[]> {
        const regions = await this.datacenter.getAllRegions();

        return regions;
    }

    @Get('/regions/:region')
    async getRegion(@Param('region') region: string): Promise<IRegionDatacenterLocal> {
        const regionFound = await this.datacenter.getRegion(region);

        return regionFound;
    }


    @Get('/regions/:region/sizes')
    async getAllRegionSizes(@Param('region') region: string): Promise<IRegionSizeDatacenterLocal[]> {
        const sizes = await this.datacenter.getAllRegionSizes(region);

        return sizes;
    }

    @Get('/regions/:region/sizes/:size')
    async getRegionSize(
        @Param('region') region: string,
            @Param('size') size: string
    ): Promise<IRegionSizeDatacenterLocal> {
        const sizeFound = await this.datacenter.getRegionSize(
            region,
            size
        );

        return sizeFound;
    }

    //////////// SUBSCRIPTIONS ////////////
    @Get('/subscriptions')
    async getAllSubscriptions(): Promise<ISubscriptionDatacenterLocalView[]> {
        const subscriptions = await this.datacenter.getAllSubscriptions();

        return subscriptions;
    }

    @Get('/subscriptions/:subscriptionId')
    async getSubscription(@Param('subscriptionId') subscriptionId: string): Promise<ISubscriptionDatacenterLocalData> {
        const subscription = await this.datacenter.getSubscription(subscriptionId);

        return subscription;
    }

    @Post('/subscriptions')
    async createSubscription(@Body() subscriptionToCreate: ISubscriptionDatacenterLocalToCreate): Promise<ISubscriptionDatacenterLocalView> {
        const subscription = await this.datacenter.createSubscription(subscriptionToCreate);

        return subscription;
    }

    @Put('/subscriptions/:subscriptionId')
    async updateSubscription(
        @Param('subscriptionId') subscriptionId: string,
            @Body() subscriptionToUpdate: ISubscriptionDatacenterLocalToUpdate
    ): Promise<ISubscriptionDatacenterLocalView> {
        const subscription = await this.datacenter.updateSubscription(
            subscriptionId,
            subscriptionToUpdate
        );

        return subscription;
    }

    @Delete('/subscriptions/:subscriptionId')
    @HttpCode(204)
    async removeSubscription(@Param('subscriptionId') subscriptionId: string): Promise<void> {
        await this.datacenter.removeSubscription(subscriptionId);
    }

    //////////// IMAGES ////////////
    @Get('/subscriptions/:subscriptionId/regions/:region/images')
    async getAllImages(
        @Param('subscriptionId') subscriptionId: string,
            @Param('region') region: string
    ): Promise<IImageDatacenterLocalView[]> {
        const images = await this.datacenter.getAllImages(
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
    ): Promise<IImageDatacenterLocalData> {
        const image = await this.datacenter.getImage(
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
            @Body() imageToCreate: IImageDatacenterLocalToCreate
    ): Promise<IImageDatacenterLocalView> {
        const image = await this.datacenter.createImage(
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
            @Body() imageToUpdate: IImageDatacenterLocalToUpdate
    ): Promise<IImageDatacenterLocalView> {
        const image = await this.datacenter.updateImage(
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
        await this.datacenter.removeImage(
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
    ): Promise<IInstanceDatacenterLocalView[]> {
        const instances = await this.datacenter.getAllInstances(
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
    ): Promise<IInstanceDatacenterLocalData> {
        const instance = await this.datacenter.getInstance(
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
            @Body() instancesToCreate: IInstancesDatacenterLocalToCreate
    ): Promise<IInstanceDatacenterLocalView[]> {
        const instances = await this.datacenter.createInstances(
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
            @Body() instancesIds: IInstanceDatacenterLocalToRemove[]
    ): Promise<void> {
        await this.datacenter.removeInstances(
            subscriptionId,
            region,
            instancesIds
        );
    }
}
