import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import {
    EProxyCheapNetworkType,
    EProxyCheapStatus,
    PROXY_CHEAP_NETWORK_TYPE_LIST,
} from './pc-server.interface';
import type {
    IProxyCheapProxiesResponse,
    IProxyCheapProxy,
} from './pc-server.interface';
import type { AxiosInstance } from 'axios';


export class ProxyCheapServerApi {
    private readonly instance: AxiosInstance;

    constructor(
        key: string,
        secret: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.proxy-cheap.com',
            headers: {
                'X-Api-Key': key,
                'X-Api-Secret': secret,
            },
        });
    }

    async getAllProxies(networkType: EProxyCheapNetworkType): Promise<IProxyCheapProxy[]> {
        const res = await this.instance.get<IProxyCheapProxiesResponse>('proxies');
        const proxies = res.data.proxies.filter((p) => p.status === EProxyCheapStatus.ACTIVE);
        let proxiesFiltered: IProxyCheapProxy[];

        if (networkType === EProxyCheapNetworkType.ALL) {
            proxiesFiltered = proxies.filter((p) => PROXY_CHEAP_NETWORK_TYPE_LIST.includes(p.networkType));
        } else {
            proxiesFiltered = proxies.filter((p) => p.networkType === networkType);
        }

        return proxiesFiltered;
    }
}
