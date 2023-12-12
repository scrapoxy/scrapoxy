import { promises as fs } from 'fs';
import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { validate } from '@scrapoxy/backend-sdk';
import {
    ONE_MINUTE_IN_MS,
    safeJoin,
} from '@scrapoxy/common';
import {
    convertInstanceStatus,
    convertProxyStatus,
    EImageCloudlocalStatus,
    EInstanceCloudlocalStatus,
    fromRegionCloudlocalStore,
    fromSubscriptionCloudlocalStore,
    toImageCloudlocalData,
    toImageCloudlocalView,
    toInstanceCloudlocalData,
    toInstanceCloudlocalView,
    toSubscriptionCloudlocalData,
    toSubscriptionCloudlocalStore,
    toSubscriptionCloudlocalView,
} from '@scrapoxy/connector-cloudlocal-sdk';
import { Proxy } from '@scrapoxy/proxy-sdk';
import {
    ImageCloudlocalAlreadyExistsError,
    ImageCloudlocalNotFoundError,
    ImageCloudlocalRemoveError,
    InstanceCloudlocalAlreadyExistsError,
    InstanceCloudlocalCreateError,
    InstanceCloudlocalNotFoundError,
    RegionCloudlocalNotFoundError,
    RegionSizeCloudlocalNotFoundError,
    SubscriptionCloudlocalAlreadyExistsError,
    SubscriptionCloudlocalNotFoundError,
    SubscriptionCloudlocalRemoveError,
} from './client';
import { CLOUDLOCAL_MODULE_CONFIG } from './cloudlocal.constants';
import {
    schemaImageCloudlocalToCreate,
    schemaImageCloudlocalToUpdate,
    schemaInstancesCloudlocalToCreate,
    schemaSubscriptionCloudlocalToCreate,
    schemaSubscriptionCloudlocalToUpdate,
} from './cloudlocal.validation';
import type { IProxyTest } from './cloudlocal.interface';
import type { ICloudlocalModuleConfig } from './cloudlocal.module';
import type {
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import type {
    ICloudlocal,
    IImageCloudlocalData,
    IImageCloudlocalModel,
    IImageCloudlocalToCreate,
    IImageCloudlocalToUpdate,
    IImageCloudlocalView,
    IInstanceCloudlocalData,
    IInstanceCloudlocalModel,
    IInstanceCloudlocalToRemove,
    IInstanceCloudlocalView,
    IInstancesCloudlocalToCreate,
    IRegionCloudlocal,
    IRegionCloudlocalModel,
    IRegionCloudlocalStore,
    IRegionSizeCloudlocal,
    ISubscriptionCloudlocalData,
    ISubscriptionCloudlocalModel,
    ISubscriptionCloudlocalStore,
    ISubscriptionCloudlocalToCreate,
    ISubscriptionCloudlocalToUpdate,
    ISubscriptionCloudlocalView,
    ISubscriptionRegionCloudlocalModel,
} from '@scrapoxy/connector-cloudlocal-sdk';
import type { IProxy } from '@scrapoxy/proxy-sdk';


const REGIONS_STORE: IRegionCloudlocalStore[] = [
    {
        id: 'europe',
        description: 'Europe (Paris)',
        sizes: [
            {
                id: 'small',
                description: 'Small',
                vcpus: 1,
                memory: 1024,
            },
            {
                id: 'medium',
                description: 'Medium',
                vcpus: 2,
                memory: 2048,
            },
            {
                id: 'large',
                description: 'Large',
                vcpus: 4,
                memory: 4096,
            },
        ],
    },
    {
        id: 'asia',
        description: 'Asia (Singapour)',
        sizes: [
            {
                id: 'large',
                description: 'Large',
                vcpus: 4,
                memory: 4096,
            },
        ],
    },
    {
        id: 'northamerica',
        description: 'North American (Washington)',
        sizes: [
            {
                id: 'small',
                description: 'Small',
                vcpus: 1,
                memory: 1024,
            },
            {
                id: 'medium',
                description: 'Medium',
                vcpus: 2,
                memory: 2048,
            },
        ],
    },
];


interface IStore {
    subscriptions: ISubscriptionCloudlocalStore[];
}


class FakeProxy implements IProxy {
    readonly connectsCount = 0;

    private portValue: number | null = null;

    get port(): number | null {
        return this.portValue;
    }

    listen(port: number): Promise<number> {
        if (port > 0) {
            this.portValue = port;
        } else {
            this.portValue = Math.floor(Math.random() * (65535 - 1024)) + 1024;
        }

        return Promise.resolve(this.portValue);
    }

    close(): Promise<void> {
        return Promise.resolve();
    }
}


@Injectable()
export class CloudlocalService implements ICloudlocal, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CloudlocalService.name);

    private readonly subscriptions = new Map<string, ISubscriptionCloudlocalModel>();

    private readonly refreshInterval: NodeJS.Timeout;

    private readonly regions = new Map<string, IRegionCloudlocalModel>();

    constructor(@Inject(CLOUDLOCAL_MODULE_CONFIG)
    private readonly config: ICloudlocalModuleConfig) {
        // Load regions
        for (const regionStore of REGIONS_STORE) {
            const region = fromRegionCloudlocalStore(regionStore);
            this.regions.set(
                region.id,
                region
            );
        }

        this.refreshInterval = setInterval(
            () => {
                this.refresh()
                    .catch((err: any) => {
                        this.logger.error(err);
                    });
            },
            500
        );
    }

    async onModuleInit(): Promise<void> {
        await this.loadStore();
    }

    async onModuleDestroy(): Promise<void> {
        await this.forceStop();

        clearInterval(this.refreshInterval);
    }

    getFakeProxies(
        subscriptionId: string,
        region: string
    ): IProxyTest[] {
        this.logger.debug(`getFakeProxies(): subscriptionId=${subscriptionId} / region=${region}`);

        const [
            subscriptionRegionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );

        return Array.from(subscriptionRegionFound.instances.values())
            .map((p) => {
                const proxy: IProxyTest = {
                    key: p.id,
                    status: convertInstanceStatus(p.status),
                };

                return proxy;
            });
    }

    async initFakeProxies(
        subscriptionId: string,
        region: string,
        size: string,
        imageId: string,
        proxies: IProxyTest[]
    ): Promise<void> {
        this.logger.debug(`initProxies(): subscriptionId=${subscriptionId} / region=${region} / size=${size} / imageId=${imageId} / proxies.length=${proxies.length}`);

        const [
            subscriptionRegionFound, subscriptionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );

        subscriptionRegionFound.instances.clear();

        const nowTime = Date.now();
        for (const proxy of proxies) {
            const instance: IInstanceCloudlocalModel = {
                id: proxy.key,
                subscriptionId: subscriptionFound.id,
                region: subscriptionRegionFound.id,
                imageId,
                size,
                status: convertProxyStatus(proxy.status),
                port: null,
                proxy: new FakeProxy(),
                lastRefreshTs: nowTime,
                error: null,
            };

            subscriptionRegionFound.instances.set(
                instance.id,
                instance
            );
        }
    }

    //////////// REGIONS ////////////
    async getAllRegions(): Promise<IRegionCloudlocal[]> {
        this.logger.debug('getAllRegions()');

        return Array.from(this.regions.values());
    }

    async getRegion(region: string): Promise<IRegionCloudlocal> {
        this.logger.debug(`getRegion(): region=${region}`);

        const regionFound = this.regions.get(region);

        if (!regionFound) {
            throw new RegionCloudlocalNotFoundError(region);
        }

        return regionFound;
    }

    async getAllRegionSizes(region: string): Promise<IRegionSizeCloudlocal[]> {
        this.logger.debug(`getAllSizes(): region=${region}`);

        const regionFound = this.regions.get(region);

        if (!regionFound) {
            throw new RegionCloudlocalNotFoundError(region);
        }

        return Array.from(regionFound.sizes.values());
    }

    async getRegionSize(
        region: string,
        size: string
    ): Promise<IRegionSizeCloudlocal> {
        this.logger.debug(`getRegionSize(): region=${region}, size=${size}`);

        const regionFound = this.regions.get(region);

        if (!regionFound) {
            throw new RegionCloudlocalNotFoundError(region);
        }

        const sizeFound = regionFound.sizes.get(size);

        if (!sizeFound) {
            throw new RegionSizeCloudlocalNotFoundError(
                region,
                size
            );
        }

        return sizeFound;
    }

    //////////// SUBSCRIPIO ////////////
    async getAllSubscriptions(): Promise<ISubscriptionCloudlocalView[]> {
        this.logger.debug('getAllSubscriptions()');

        return Array
            .from(this.subscriptions.values())
            .map(toSubscriptionCloudlocalView);
    }

    async getSubscription(subscriptionId: string): Promise<ISubscriptionCloudlocalData> {
        this.logger.debug(`getSubscription(): subscriptionId=${subscriptionId}`);

        const subscriptionFound = this.subscriptions.get(subscriptionId);

        if (!subscriptionFound) {
            throw new SubscriptionCloudlocalNotFoundError(subscriptionId);
        }

        return toSubscriptionCloudlocalData(subscriptionFound);
    }

    async createSubscription(subscriptionToCreate: ISubscriptionCloudlocalToCreate): Promise<ISubscriptionCloudlocalView> {
        this.logger.debug(`createSubscription(): subscriptionToCreate.id=${subscriptionToCreate.id}`);

        await validate(
            schemaSubscriptionCloudlocalToCreate,
            subscriptionToCreate
        );

        if (this.subscriptions.has(subscriptionToCreate.id)) {
            throw new SubscriptionCloudlocalAlreadyExistsError(subscriptionToCreate.id);
        }

        const subscription: ISubscriptionCloudlocalModel = {
            ...subscriptionToCreate,
            regions: new Map<string, ISubscriptionRegionCloudlocalModel>(),
            removeForcedCount: 0,
        };

        this.subscriptions.set(
            subscription.id,
            subscription
        );

        await this.saveStore();

        return toSubscriptionCloudlocalView(subscription);
    }

    async updateSubscription(
        subscriptionId: string,
        subscriptionToUpdate: ISubscriptionCloudlocalToUpdate
    ): Promise<ISubscriptionCloudlocalView> {
        this.logger.debug(`updateSubscription(): subscriptionId=${subscriptionId}`);

        await validate(
            schemaSubscriptionCloudlocalToUpdate,
            subscriptionToUpdate
        );

        const subscriptionFound = this.subscriptions.get(subscriptionId);

        if (!subscriptionFound) {
            throw new SubscriptionCloudlocalNotFoundError(subscriptionId);
        }

        subscriptionFound.instancesLimit = subscriptionToUpdate.instancesLimit;
        subscriptionFound.installDelay = subscriptionToUpdate.installDelay;
        subscriptionFound.startingDelay = subscriptionToUpdate.startingDelay;
        subscriptionFound.stoppingDelay = subscriptionToUpdate.stoppingDelay;
        subscriptionFound.transitionStartingToStarted = subscriptionToUpdate.transitionStartingToStarted;
        subscriptionFound.transitionStoppingToStopped = subscriptionToUpdate.transitionStoppingToStopped;

        await this.saveStore();

        return toSubscriptionCloudlocalView(subscriptionFound);
    }

    async removeSubscription(subscriptionId: string): Promise<void> {
        this.logger.debug(`removeSubscription(): subscriptionId=${subscriptionId}`);

        const subscriptionFound = this.subscriptions.get(subscriptionId);

        if (!subscriptionFound) {
            throw new SubscriptionCloudlocalNotFoundError(subscriptionId);
        }

        for (const region of subscriptionFound.regions.values()) {
            if (region.images.size > 0) {
                throw new SubscriptionCloudlocalRemoveError(
                    subscriptionId,
                    `Subscription has images in region ${region.id}`
                );
            }

            if (region.instances.size > 0) {
                throw new SubscriptionCloudlocalRemoveError(
                    subscriptionId,
                    `Subscription has instances in region ${region.id}`
                );
            }
        }


        this.subscriptions.delete(subscriptionFound.id);

        await this.saveStore();
    }

    //////////// IMAGES ////////////
    async getAllImages(
        subscriptionId: string,
        region: string
    ): Promise<IImageCloudlocalView[]> {
        this.logger.debug(`getAllImages(): subscriptionId=${subscriptionId} / region=${region}`);

        const [
            subscriptionRegionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );

        return Array.from(subscriptionRegionFound.images.values())
            .map(toImageCloudlocalView);
    }

    async getImage(
        subscriptionId: string,
        region: string,
        imageId: string
    ): Promise<IImageCloudlocalData> {
        this.logger.debug(`getImage(): subscriptionId=${subscriptionId} / region=${region} / imageId=${imageId}`);

        const [
            subscriptionRegionFound, subscriptionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );
        const imageFound = subscriptionRegionFound.images.get(imageId);

        if (!imageFound) {
            throw new ImageCloudlocalNotFoundError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                imageId
            );
        }

        return toImageCloudlocalData(imageFound);
    }

    async createImage(
        subscriptionId: string,
        region: string,
        imageToCreate: IImageCloudlocalToCreate
    ): Promise<IImageCloudlocalView> {
        this.logger.debug(`createImage(): subscriptionId=${subscriptionId} / region=${region} / imageToCreate.id=${imageToCreate.id}`);

        await validate(
            schemaImageCloudlocalToCreate,
            imageToCreate
        );

        const [
            subscriptionRegionFound, subscriptionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );

        if (subscriptionRegionFound.images.has(imageToCreate.id)) {
            throw new ImageCloudlocalAlreadyExistsError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                imageToCreate.id
            );
        }

        const image: IImageCloudlocalModel = {
            ...imageToCreate,
            subscriptionId: subscriptionFound.id,
            region: subscriptionRegionFound.id,
            status: EImageCloudlocalStatus.CREATING,
            lastRefreshTs: Date.now(),
        };

        subscriptionRegionFound.images.set(
            image.id,
            image
        );

        await this.saveStore();

        return toImageCloudlocalView(image);
    }

    async updateImage(
        subscriptionId: string,
        region: string,
        imageId: string,
        imageToUpdate: IImageCloudlocalToUpdate
    ): Promise<IImageCloudlocalView> {
        this.logger.debug(`updateImage(): subscriptionId=${subscriptionId} / region=${region} / imageId=${imageId}`);

        await validate(
            schemaImageCloudlocalToUpdate,
            imageToUpdate
        );

        const [
            subscriptionRegionFound, subscriptionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );
        const imageFound = subscriptionRegionFound.images.get(imageId);

        if (!imageFound) {
            throw new ImageCloudlocalNotFoundError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                imageId
            );
        }

        imageFound.certificate = imageToUpdate.certificate;

        await this.saveStore();

        return toImageCloudlocalView(imageFound);
    }


    async removeImage(
        subscriptionId: string,
        region: string,
        imageId: string
    ): Promise<void> {
        this.logger.debug(`removeImage(): subscriptionId=${subscriptionId} / region=${region} / imageId=${imageId}`);

        const [
            subscriptionRegionFound, subscriptionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );
        const imageFound = subscriptionRegionFound.images.get(imageId);

        if (!imageFound) {
            throw new ImageCloudlocalNotFoundError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                imageId
            );
        }

        for (const instance of subscriptionRegionFound.instances.values()) {
            if (instance.imageId === imageFound.id) {
                throw new ImageCloudlocalRemoveError(
                    subscriptionFound.id,
                    subscriptionRegionFound.id,
                    imageId,
                    'Image in use'
                );
            }
        }

        subscriptionRegionFound.images.delete(imageFound.id);

        await this.saveStore();
    }

    //////////// INSTANCES ////////////
    async getAllInstances(
        subscriptionId: string,
        region: string
    ): Promise<IInstanceCloudlocalView[]> {
        this.logger.debug(`getAllInstances(): subscriptionId=${subscriptionId} / region=${region}`);

        const [
            subscriptionRegionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );

        return Array
            .from(subscriptionRegionFound.instances.values())
            .map(toInstanceCloudlocalView);
    }

    getAllInstancesProxies(
        subscriptionId: string,
        region: string
    ): IProxy[] {
        this.logger.debug(`getAllInstancesProxies(): subscriptionId=${subscriptionId} / region=${region}`);

        const [
            subscriptionRegionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );

        return Array.from(subscriptionRegionFound.instances.values())
            .map((i) => i.proxy);
    }

    async getInstance(
        subscriptionId: string,
        region: string,
        instanceId: string
    ): Promise<IInstanceCloudlocalData> {
        this.logger.debug(`getInstance(): subscriptionId=${subscriptionId} / region=${region} / instanceId=${instanceId}`);

        const [
            subscriptionRegionFound, subscriptionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );
        const instanceFound = subscriptionRegionFound.instances.get(instanceId);

        if (!instanceFound) {
            throw new InstanceCloudlocalNotFoundError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                instanceId
            );
        }

        return toInstanceCloudlocalData(instanceFound);
    }

    async createInstances(
        subscriptionId: string,
        region: string,
        instancesToCreate: IInstancesCloudlocalToCreate
    ): Promise<IInstanceCloudlocalView[]> {
        const ids = Array.isArray(instancesToCreate?.ids) ? instancesToCreate.ids : [];
        this.logger.debug(`createInstances(): subscriptionId=${subscriptionId} / region=${region} / instancesToCreate.ids=${ids.join(',')}`);

        await validate(
            schemaInstancesCloudlocalToCreate,
            instancesToCreate
        );

        const [
            subscriptionRegionFound, subscriptionFound, regionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );
        const sizeFound = regionFound.sizes.get(instancesToCreate.size);

        if (!sizeFound) {
            throw new RegionSizeCloudlocalNotFoundError(
                regionFound.id,
                instancesToCreate.size
            );
        }

        const imageFound = subscriptionRegionFound.images.get(instancesToCreate.imageId);

        if (!imageFound) {
            throw new ImageCloudlocalNotFoundError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                instancesToCreate.imageId
            );
        }

        if (imageFound.status !== EImageCloudlocalStatus.READY) {
            throw new InstanceCloudlocalCreateError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                'Cannot create instance with an image which is not ready'
            );
        }

        if (subscriptionRegionFound.instances.size + instancesToCreate.ids.length > subscriptionFound.instancesLimit) {
            throw new InstanceCloudlocalCreateError(
                subscriptionFound.id,
                subscriptionRegionFound.id,
                'Cannot create more instances than max limit'
            );
        }

        for (const id of instancesToCreate.ids) {
            if (subscriptionRegionFound.instances.has(id)) {
                throw new InstanceCloudlocalAlreadyExistsError(
                    subscriptionFound.id,
                    subscriptionRegionFound.id,
                    id
                );
            }
        }

        const
            instancesCreated: IInstanceCloudlocalView[] = [],
            nowTime = Date.now();

        for (const id of instancesToCreate.ids) {
            const proxy = new Proxy(
                new Logger('Proxy'),
                ONE_MINUTE_IN_MS,
                imageFound.certificate.cert,
                imageFound.certificate.key
            );
            const instance: IInstanceCloudlocalModel = {
                id,
                subscriptionId: subscriptionFound.id,
                region: subscriptionRegionFound.id,
                imageId: imageFound.id,
                size: sizeFound.id,
                status: EInstanceCloudlocalStatus.STARTING,
                port: null,
                proxy,
                lastRefreshTs: nowTime,
                error: null,
            };

            subscriptionRegionFound.instances.set(
                instance.id,
                instance
            );

            instancesCreated.push(toInstanceCloudlocalView(instance));
        }

        return instancesCreated;
    }

    async removeInstances(
        subscriptionId: string,
        region: string,
        instancesIds: IInstanceCloudlocalToRemove[]
    ): Promise<void> {
        const ids = instancesIds.map((i) => i.id);
        this.logger.debug(`removeInstances(): subscriptionId=${subscriptionId} / region=${region} / instancesIds=${safeJoin(ids)}`);

        const [
            subscriptionRegionFound, subscriptionFound,
        ] = this.getOrCreateSubscriptionRegion(
            subscriptionId,
            region
        );
        const instances: IInstanceCloudlocalModel[] = [];
        for (const id of instancesIds) {
            const instance = subscriptionRegionFound.instances.get(id.id);

            if (!instance) {
                throw new InstanceCloudlocalNotFoundError(
                    subscriptionFound.id,
                    subscriptionRegionFound.id,
                    id.id
                );
            }

            if (instance.status !== EInstanceCloudlocalStatus.STOPPING) {
                instances.push(instance);

                if (id.force) {
                    subscriptionFound.removeForcedCount += 1;
                }
            }
        }

        const nowTime = Date.now();
        for (const instance of instances) {
            this.logger.debug(`removeInstances(): stopping ${instance.id}...`);
            instance.status = EInstanceCloudlocalStatus.STOPPING;
            instance.lastRefreshTs = nowTime;
        }
    }

    //////////// STORAGE ////////////
    private async loadStore(): Promise<void> {
        // Clear before load
        this.subscriptions.clear();

        if (!this.config.filename) {
            return;
        }

        try {
            const data = await fs.readFile(this.config.filename);
            const store = JSON.parse(data.toString()) as IStore;

            // Load subscriptions
            for (const subscriptionStore of store.subscriptions) {
                const subscriptionModel = fromSubscriptionCloudlocalStore(subscriptionStore);
                this.subscriptions.set(
                    subscriptionModel.id,
                    subscriptionModel
                );
            }
        } catch (err: any) {
            this.logger.error(`Cannot read local store: ${err.message}`);
        }
    }

    private async saveStore(): Promise<void> {
        if (!this.config.filename) {
            return;
        }

        const subscriptions = Array.from(this.subscriptions.values())
            .map(toSubscriptionCloudlocalStore);
        const store: IStore = {
            subscriptions,
        };
        const data = JSON.stringify(
            store,
            void 0,
            2
        );

        await fs.writeFile(
            this.config.filename,
            data
        );
    }

    //////////// REFRESH ////////////
    private async refresh(): Promise<void> {
        const nowTime = Date.now();
        let save = false;
        for (const subscription of this.subscriptions.values()) {
            for (const subscriptionRegion of subscription.regions.values()) {
                // Images
                const images = Array.from(subscriptionRegion.images.values());
                const imagesIds = images.map((i) => i.id);
                this.logger.debug(`refresh(): subscription=${subscription.id} / region=${subscriptionRegion.id} / images.id=${safeJoin(imagesIds)}`);
                for (const image of images) {
                    switch (image.status) {
                        case EImageCloudlocalStatus.CREATING: {
                            if (image.lastRefreshTs + subscription.installDelay > nowTime) {
                                break;
                            }

                            image.status = EImageCloudlocalStatus.READY;
                            image.lastRefreshTs = nowTime;
                            this.logger.debug(`refresh(): image ${image.id} ready`);

                            save = true;

                            break;
                        }

                        default: {
                            // Nothing
                            break;
                        }
                    }
                }

                // Instances
                const instances = Array.from(subscriptionRegion.instances.values());
                const instancesIds = instances.map((i) => i.id);
                this.logger.debug(`refresh(): subscription=${subscription.id} / region=${subscriptionRegion.id} / instances.id=${safeJoin(instancesIds)}`);

                for (const instance of instances) {
                    const proxy = instance.proxy as IProxy;
                    try {
                        switch (instance.status) {
                            case EInstanceCloudlocalStatus.STARTING: {
                                if (!subscription.transitionStartingToStarted) {
                                    break;
                                }

                                if (instance.lastRefreshTs + subscription.startingDelay > nowTime) {
                                    break;
                                }

                                await proxy.listen(0);
                                instance.status = EInstanceCloudlocalStatus.STARTED;
                                instance.port = proxy.port;
                                instance.lastRefreshTs = nowTime;
                                this.logger.debug(`refresh(): instance ${instance.id} started`);

                                break;
                            }

                            case EInstanceCloudlocalStatus.STOPPING: {
                                if (!subscription.transitionStoppingToStopped) {
                                    break;
                                }

                                if (instance.lastRefreshTs + subscription.stoppingDelay > nowTime) {
                                    break;
                                }

                                try {
                                    await proxy.close();
                                } finally {
                                    subscriptionRegion.instances.delete(instance.id);
                                    this.logger.debug(`refresh(): instance ${instance.id} removed`);
                                }

                                break;
                            }

                            default: {
                                // Nothing
                                break;
                            }
                        }
                    } catch (err: any) {
                        instance.status = EInstanceCloudlocalStatus.ERROR;
                        instance.error = err.message;

                        this.logger.error(
                            err,
                            err.stack
                        );
                    }
                }
            }
        }

        if (save) {
            await this.saveStore();
        }
    }

    //////////// MISC ////////////
    private async forceStop() {
        const promises: Promise<void>[] = [];
        for (const subscription of this.subscriptions.values()) {
            for (const subscriptionRegion of subscription.regions.values()) {
                for (const instance of subscriptionRegion.instances.values()) {
                    const proxy = instance.proxy as IProxy;
                    promises.push(proxy.close()
                        .catch((err: any) => {
                            this.logger.error(
                                err,
                                err.stack
                            );
                        }));
                }
            }
        }

        await Promise.all(promises);

        for (const subscription of this.subscriptions.values()) {
            for (const subscriptionRegion of subscription.regions.values()) {
                subscriptionRegion.instances.clear();
            }
        }
    }

    private getOrCreateSubscriptionRegion(
        subscriptionId: string, region: string
    ): [ISubscriptionRegionCloudlocalModel, ISubscriptionCloudlocalModel, IRegionCloudlocalModel] {
        const subscriptionFound = this.subscriptions.get(subscriptionId);

        if (!subscriptionFound) {
            throw new SubscriptionCloudlocalNotFoundError(subscriptionId);
        }

        const regionFound = this.regions.get(region);

        if (!regionFound) {
            throw new RegionCloudlocalNotFoundError(region);
        }

        let subscriptionRegionFound: ISubscriptionRegionCloudlocalModel | undefined = subscriptionFound.regions.get(region);

        if (!subscriptionRegionFound) {
            subscriptionRegionFound = {
                id: region,
                images: new Map<string, IImageCloudlocalModel>(),
                instances: new Map<string, IInstanceCloudlocalModel>(),
            };
            subscriptionFound.regions.set(
                subscriptionRegionFound.id,
                subscriptionRegionFound
            );
        }

        return [
            subscriptionRegionFound, subscriptionFound, regionFound,
        ];
    }
}
