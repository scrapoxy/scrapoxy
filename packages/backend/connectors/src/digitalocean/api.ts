import { Agents } from '@scrapoxy/backend-sdk';
import axios, { AxiosError } from 'axios';
import type {
    IDigitalOceanAccount,
    IDigitalOceanAccountResponse,
    IDigitalOceanAction,
    IDigitalOceanActionResponse,
    IDigitalOceanCreateDropletReferenceRequest,
    IDigitalOceanCreateDropletsRequest,
    IDigitalOceanDroplet,
    IDigitalOceanDropletResponse,
    IDigitalOceanDropletsResponse,
    IDigitalOceanError,
    IDigitalOceanRegion,
    IDigitalOceanRegionsResponse,
    IDigitalOceanSize,
    IDigitalOceanSizesResponse,
    IDigitalOceanSnapshot,
    IDigitalOceanSnapshotResponse,
    IDigitalOceanSnapshotsResponse,
} from './digitalocean.interface';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';


const
    DROPLETS_LIMIT_PER_REQUEST = 10,
    QUERY_PARAMS = {
        page: 0,
        per_page: 1000000,
    };


export class DigitalOceanError extends Error {
    constructor(
        public id: string,
        message: string
    ) {
        super(message);
    }
}


export class DigitalOceanApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.digitalocean.com/v2',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        this.instance.interceptors.response.use(
            (response) => response,
            (err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;
                    const error = response?.data as IDigitalOceanError;

                    if (error) {
                        throw new DigitalOceanError(
                            error.id,
                            error.message
                        );
                    }
                }

                throw err;
            }
        );
    }

    //////////// ACCOUNT ////////////
    async getAccount(): Promise<IDigitalOceanAccount> {
        const res = await this.instance.get<IDigitalOceanAccountResponse>(
            'account',
            {
                params: QUERY_PARAMS,
            }
        );

        return res.data.account;
    }

    //////////// REGIONS ////////////
    async getAllRegions(): Promise<IDigitalOceanRegion[]> {
        const res = await this.instance.get<IDigitalOceanRegionsResponse>(
            'regions',
            {
                params: QUERY_PARAMS,
            }
        );

        return res.data.regions;
    }

    //////////// SIZES ////////////
    async getAllSizes(): Promise<IDigitalOceanSize[]> {
        const res = await this.instance.get<IDigitalOceanSizesResponse>(
            'sizes',
            {
                params: QUERY_PARAMS,
            }
        );

        return res.data.sizes;
    }

    //////////// DROPLETS ////////////
    async getAllDroplets(tag?: string): Promise<IDigitalOceanDroplet[]> {
        const config: AxiosRequestConfig = {
            params: {
                ...QUERY_PARAMS,
            },
        };

        if (tag && tag.length > 0) {
            config.params.tag_name = tag;
        }

        const res = await this.instance.get<IDigitalOceanDropletsResponse>(
            'droplets',
            config
        );

        return res.data.droplets;
    }

    async getDroplet(dropletId: number): Promise<IDigitalOceanDroplet> {
        const res = await this.instance.get<IDigitalOceanDropletResponse>(`/droplets/${dropletId}`);

        return res.data.droplet;
    }

    async createDropletReference(request: IDigitalOceanCreateDropletReferenceRequest): Promise<IDigitalOceanDroplet> {
        const response = await this.instance.post<IDigitalOceanDropletResponse>(
            'droplets',
            {
                image: request.imageName,
                name: request.name,
                region: request.region,
                size: request.size,
                user_data: request.userData,
            }
        );

        return response.data.droplet;
    }

    async createDroplets(request: IDigitalOceanCreateDropletsRequest): Promise<IDigitalOceanDroplet[]> {
        const res = await this.instance.post<IDigitalOceanDropletsResponse>(
            'droplets',
            {
                image: request.snapshotId,
                names: request.names.slice(
                    0,
                    DROPLETS_LIMIT_PER_REQUEST
                ),
                region: request.region,
                tags: request.tags,
                size: request.size,
                user_data: request.userData,
            }
        );

        return res.data.droplets;
    }

    async powerOnDroplet(dropletId: number): Promise<IDigitalOceanAction> {
        const res = await this.instance.post<IDigitalOceanActionResponse>(
            `droplets/${dropletId}/actions`,
            {
                type: 'power_on',
            }
        );

        return res.data.action;
    }

    async powerOffDroplet(dropletId: number): Promise<IDigitalOceanAction> {
        const res = await this.instance.post<IDigitalOceanActionResponse>(
            `droplets/${dropletId}/actions`,
            {
                type: 'power_off',
            }
        );

        return res.data.action;
    }

    async snapshotDroplet(dropletId: number): Promise<IDigitalOceanAction> {
        const res = await this.instance.post<IDigitalOceanActionResponse>(
            `droplets/${dropletId}/actions`,
            {
                type: 'snapshot',
            }
        );

        return res.data.action;
    }

    async deleteDroplet(dropletId: number): Promise<void> {
        await this.instance.delete(`droplets/${dropletId}`);
    }

    async getDropletSnapshots(dropletId: number): Promise<IDigitalOceanSnapshot[]> {
        const res = await this.instance.get<IDigitalOceanSnapshotsResponse>(
            `droplets/${dropletId}/snapshots`,
            {
                params: QUERY_PARAMS,
            }
        );

        return res.data.snapshots;
    }

    //////////// SNAPSHOTS ////////////
    async getAllSnapshots(): Promise<IDigitalOceanSnapshot[]> {
        const res = await this.instance.get<IDigitalOceanSnapshotsResponse>('snapshots');

        return res.data.snapshots;
    }

    async getSnapshot(snapshotId: number): Promise<IDigitalOceanSnapshot> {
        const res = await this.instance.get<IDigitalOceanSnapshotResponse>(`snapshots/${snapshotId}`);

        return res.data.snapshot;
    }

    async deleteSnapshot(snapshotId: number): Promise<void> {
        await this.instance.delete(`snapshots/${snapshotId}`);
    }

    //////////// ACTIONS ////////////
    async getAction(actionId: number): Promise<IDigitalOceanAction> {
        const res = await this.instance.get<IDigitalOceanActionResponse>(
            `actions/${actionId}`,
            {
                params: QUERY_PARAMS,
            }
        );

        return res.data.action;
    }
}
