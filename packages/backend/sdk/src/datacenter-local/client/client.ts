import axios from 'axios';
import { catchError } from './client.helpers';
import { Agents } from '../../helpers';
import type {
    IDatacenterLocal,
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
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


export const SUBSCRIPTION_LOCAL_DEFAULTS: ISubscriptionDatacenterLocalToUpdate = {
    instancesLimit: 100,
    installDelay: 200,
    startingDelay: 750,
    stoppingDelay: 750,
    transitionStartingToStarted: true,
    transitionStoppingToStopped: true,
};


export class DatacenterLocalClient implements IDatacenterLocal {
    private readonly instance: AxiosInstance;

    constructor(
        url: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: url,
            headers: {
                'User-Agent': 'datacenter-local-client/4',
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
    async getAllRegions(): Promise<IRegionDatacenterLocal[]> {
        const res = await this.instance.get<IRegionDatacenterLocal[]>('regions');

        return res.data;
    }

    async getRegion(region: string): Promise<IRegionDatacenterLocal> {
        const res = await this.instance.get<IRegionDatacenterLocal>(`regions/${region}`);

        return res.data;
    }

    async getAllRegionSizes(region: string): Promise<IRegionSizeDatacenterLocal[]> {
        const res = await this.instance.get<IRegionSizeDatacenterLocal[]>(`regions/${region}/sizes`);

        return res.data;
    }

    async getRegionSize(
        region: string,
        size: string
    ): Promise<IRegionSizeDatacenterLocal> {
        const res = await this.instance.get<IRegionSizeDatacenterLocal>(`regions/${region}/sizes/${size}`);

        return res.data;
    }

    //////////// SUBSCRIPTIONS ////////////
    async getAllSubscriptions(): Promise<ISubscriptionDatacenterLocalView[]> {
        const res = await this.instance.get<ISubscriptionDatacenterLocalView[]>('subscriptions');

        return res.data;
    }

    async getSubscription(subscriptionId: string): Promise<ISubscriptionDatacenterLocalData> {
        const res = await this.instance.get<ISubscriptionDatacenterLocalData>(`subscriptions/${subscriptionId}`);

        return res.data;
    }

    async createSubscription(subscriptionToCreate: ISubscriptionDatacenterLocalToCreate): Promise<ISubscriptionDatacenterLocalView> {
        const res = await this.instance.post<ISubscriptionDatacenterLocalView>(
            'subscriptions',
            subscriptionToCreate
        );

        return res.data;
    }

    async updateSubscription(
        subscriptionId: string,
        subscriptionToUpdate: ISubscriptionDatacenterLocalToUpdate
    ): Promise<ISubscriptionDatacenterLocalView> {
        const res = await this.instance.put<ISubscriptionDatacenterLocalView>(
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
    ): Promise<IImageDatacenterLocalView[]> {
        const res = await this.instance.get<IImageDatacenterLocalView[]>(`subscriptions/${subscriptionId}/regions/${region}/images`);

        return res.data;
    }

    async getImage(
        subscriptionId: string,
        region: string,
        imageId: string
    ): Promise<IImageDatacenterLocalData> {
        const res = await this.instance.get<IImageDatacenterLocalData>(`subscriptions/${subscriptionId}/regions/${region}/images/${imageId}`);

        return res.data;
    }

    async createImage(
        subscriptionId: string,
        region: string,
        imageToCreate: IImageDatacenterLocalToCreate
    ): Promise<IImageDatacenterLocalView> {
        const res = await this.instance.post<IImageDatacenterLocalView>(
            `subscriptions/${subscriptionId}/regions/${region}/images`,
            imageToCreate
        );

        return res.data;
    }

    async updateImage(
        subscriptionId: string,
        region: string,
        imageId: string,
        imageToUpdate: IImageDatacenterLocalToUpdate
    ): Promise<IImageDatacenterLocalView> {
        const res = await this.instance.put<IImageDatacenterLocalView>(
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
    ): Promise<IInstanceDatacenterLocalView[]> {
        const res = await this.instance.get<IInstanceDatacenterLocalView[]>(`subscriptions/${subscriptionId}/regions/${region}/instances`);

        return res.data;
    }

    async getInstance(
        subscriptionId: string,
        region: string,
        instanceId: string
    ): Promise<IInstanceDatacenterLocalData> {
        const res = await this.instance.get<IInstanceDatacenterLocalData>(`subscriptions/${subscriptionId}/regions/${region}/instances/${instanceId}`);

        return res.data;
    }

    async createInstances(
        subscriptionId: string,
        region: string,
        instancesToCreate: IInstancesDatacenterLocalToCreate
    ): Promise<IInstanceDatacenterLocalView[]> {
        const res = await this.instance.post<IInstanceDatacenterLocalView[]>(
            `subscriptions/${subscriptionId}/regions/${region}/instances/create`,
            instancesToCreate
        );

        return res.data;
    }

    async removeInstances(
        subscriptionId: string,
        region: string,
        instancesIds: IInstanceDatacenterLocalToRemove[]
    ): Promise<void> {
        await this.instance.post(
            `subscriptions/${subscriptionId}/regions/${region}/instances/remove`,
            instancesIds
        );
    }
}
