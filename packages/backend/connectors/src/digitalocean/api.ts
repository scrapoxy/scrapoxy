import { Agents } from '@scrapoxy/backend-sdk';
import axios, { AxiosError } from 'axios';
import type {
    IDigitalOceanAccount,
    IDigitalOceanAccountResponse,
    IDigitalOceanAction,
    IDigitalOceanActionResponse,
    IDigitalOceanCreateDropletsRequest,
    IDigitalOceanDroplet,
    IDigitalOceanDropletsResponse,
    IDigitalOceanError,
    IDigitalOceanRegion,
    IDigitalOceanRegionsResponse,
    IDigitalOceanSize,
    IDigitalOceanSizesResponse,
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

    async createDroplets(request: IDigitalOceanCreateDropletsRequest): Promise<IDigitalOceanDroplet[]> {
        const res = await this.instance.post<IDigitalOceanDropletsResponse>(
            'droplets',
            {
                image: request.imageName,
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

    async deleteDroplet(dropletId: number): Promise<void> {
        await this.instance.delete(`droplets/${dropletId}`);
    }
}
