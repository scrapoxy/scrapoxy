import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type {
    ILiveproxiesPlanB2B,
    ILiveproxiesProxyList,
} from './liveproxies.interface';
import type { ILiveproxiesPlanB2C } from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


export class LiveproxiesApi {
    private readonly instance: AxiosInstance;

    constructor(
        apiKey: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://user-api.liveproxies.io/user/',
            headers: {
                Authentication: `Bearer ${apiKey}`,
            },
        });
    }

    async getAllPlans(): Promise<(ILiveproxiesPlanB2C | ILiveproxiesPlanB2B)[]> {
        const res = await this.instance.get<(ILiveproxiesPlanB2C | ILiveproxiesPlanB2B)[]>('plans');

        return res.data;
    }

    async getProxyList(packageId: number): Promise<ILiveproxiesProxyList> {
        const res = await this.instance.get<ILiveproxiesProxyList[]>(
            'proxy-list',
            {
                params: {
                    packageId,
                },
            }
        );

        if (res.data.length !== 1) {
            throw new Error('Invalid proxy list count');
        }

        return res.data[ 0 ];
    }
}
