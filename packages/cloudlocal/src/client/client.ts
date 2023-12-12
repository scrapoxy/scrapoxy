import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import { catchError } from './client.helpers';
import type {
    ICloudlocal,
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
import type { AxiosInstance } from 'axios';


export const SUBSCRIPTION_LOCAL_DEFAULTS: ISubscriptionCloudlocalToUpdate = {
    instancesLimit: 100,
    installDelay: 200,
    startingDelay: 750,
    stoppingDelay: 750,
    transitionStartingToStarted: true,
    transitionStoppingToStopped: true,
};


export class CloudlocalClient implements ICloudlocal {
    private readonly instance: AxiosInstance;

    constructor(
        url: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: url,
            headers: {
                'User-Agent': 'cloudlocal-client/4',
            },
        });

        this.instance.interceptors.response.use(
            void 0,
            (err: any) => {
                if (err.response) {
                    catchError(err.response.data);
                }

                throw err;
            }
        );
    }

    //////////// REGIONS ////////////
    async getAllRegions(): Promise<IRegionCloudlocal[]> {
        const res = await this.instance.get<IRegionCloudlocal[]>('regions');

        return res.data;
    }

    async getRegion(region: string): Promise<IRegionCloudlocal> {
        const res = await this.instance.get<IRegionCloudlocal>(`regions/${region}`);

        return res.data;
    }

    async getAllRegionSizes(region: string): Promise<IRegionSizeCloudlocal[]> {
        const res = await this.instance.get<IRegionSizeCloudlocal[]>(`regions/${region}/sizes`);

        return res.data;
    }

    async getRegionSize(
        region: string,
        size: string
    ): Promise<IRegionSizeCloudlocal> {
        const res = await this.instance.get<IRegionSizeCloudlocal>(`regions/${region}/sizes/${size}`);

        return res.data;
    }

    //////////// SUBSCRIPTIONS ////////////
    async getAllSubscriptions(): Promise<ISubscriptionCloudlocalView[]> {
        const res = await this.instance.get<ISubscriptionCloudlocalView[]>('subscriptions');

        return res.data;
    }

    async getSubscription(subscriptionId: string): Promise<ISubscriptionCloudlocalData> {
        const res = await this.instance.get<ISubscriptionCloudlocalData>(`subscriptions/${subscriptionId}`);

        return res.data;
    }

    async createSubscription(subscriptionToCreate: ISubscriptionCloudlocalToCreate): Promise<ISubscriptionCloudlocalView> {
        const res = await this.instance.post<ISubscriptionCloudlocalView>(
            'subscriptions',
            subscriptionToCreate
        );

        return res.data;
    }

    async updateSubscription(
        subscriptionId: string,
        subscriptionToUpdate: ISubscriptionCloudlocalToUpdate
    ): Promise<ISubscriptionCloudlocalView> {
        const res = await this.instance.put<ISubscriptionCloudlocalView>(
            `subscriptions/${subscriptionId}`,
            subscriptionToUpdate
        );

        return res.data;
    }

    async removeSubscription(subscriptionId: string): Promise<void> {
        await this.instance.delete(`subscriptions/${subscriptionId}`);
    }

    //////////// IMAGES ////////////
    async getAllImages(
        subscriptionId: string,
        region: string
    ): Promise<IImageCloudlocalView[]> {
        const res = await this.instance.get<IImageCloudlocalView[]>(`subscriptions/${subscriptionId}/regions/${region}/images`);

        return res.data;
    }

    async getImage(
        subscriptionId: string,
        region: string,
        imageId: string
    ): Promise<IImageCloudlocalData> {
        const res = await this.instance.get<IImageCloudlocalData>(`subscriptions/${subscriptionId}/regions/${region}/images/${imageId}`);

        return res.data;
    }

    async createImage(
        subscriptionId: string,
        region: string,
        imageToCreate: IImageCloudlocalToCreate
    ): Promise<IImageCloudlocalView> {
        const res = await this.instance.post<IImageCloudlocalView>(
            `subscriptions/${subscriptionId}/regions/${region}/images`,
            imageToCreate
        );

        return res.data;
    }

    async updateImage(
        subscriptionId: string,
        region: string,
        imageId: string,
        imageToUpdate: IImageCloudlocalToUpdate
    ): Promise<IImageCloudlocalView> {
        const res = await this.instance.put<IImageCloudlocalView>(
            `subscriptions/${subscriptionId}/regions/${region}/images/${imageId}`,
            imageToUpdate
        );

        return res.data;
    }

    async removeImage(
        subscriptionId: string,
        region: string,
        imageId: string
    ): Promise<void> {
        await this.instance.delete(`subscriptions/${subscriptionId}/regions/${region}/images/${imageId}`);
    }

    //////////// INSTANCES ////////////
    async getAllInstances(
        subscriptionId: string,
        region: string
    ): Promise<IInstanceCloudlocalView[]> {
        const res = await this.instance.get<IInstanceCloudlocalView[]>(`subscriptions/${subscriptionId}/regions/${region}/instances`);

        return res.data;
    }

    async getInstance(
        subscriptionId: string,
        region: string,
        instanceId: string
    ): Promise<IInstanceCloudlocalData> {
        const res = await this.instance.get<IInstanceCloudlocalData>(`subscriptions/${subscriptionId}/regions/${region}/instances/${instanceId}`);

        return res.data;
    }

    async createInstances(
        subscriptionId: string,
        region: string,
        instancesToCreate: IInstancesCloudlocalToCreate
    ): Promise<IInstanceCloudlocalView[]> {
        const res = await this.instance.post<IInstanceCloudlocalView[]>(
            `subscriptions/${subscriptionId}/regions/${region}/instances/create`,
            instancesToCreate
        );

        return res.data;
    }

    async removeInstances(
        subscriptionId: string,
        region: string,
        instancesIds: IInstanceCloudlocalToRemove[]
    ): Promise<void> {
        await this.instance.post(
            `subscriptions/${subscriptionId}/regions/${region}/instances/remove`,
            instancesIds
        );
    }
}
