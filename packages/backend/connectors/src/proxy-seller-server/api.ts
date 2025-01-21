import { Agents } from '@scrapoxy/backend-sdk';
import { EProxySellerNetworkType } from '@scrapoxy/common';
import axios from 'axios';
import {
    EProxySellerProxyStatus,
    EProxySellerServerResponseStatus,
} from './ps-server.interface';
import type {
    IProxySellerGetProxiesAll,
    IProxySellerGetProxiesItems,
    IProxySellerProxy,
    IProxySellerServerResponse,
} from './ps-server.interface';
import type { AxiosInstance } from 'axios';


export class ErrorProxySellerServerApi extends Error {}


export class ProxySellerServerApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `https://proxy-seller.com/personal/api/v1/${token}/`,
        });

        this.instance.interceptors.response.use(
            (res) => {
                if (res.data.status === EProxySellerServerResponseStatus.SUCCESS) {
                    return res;
                }

                if (res.data.errors && res.data.errors.length > 0) {
                    throw new ErrorProxySellerServerApi(res.data.errors[ 0 ].message);
                }

                throw new ErrorProxySellerServerApi('Unknown error on Proxy-Seller API');
            },
            (err) => {
                throw err;
            }
        );
    }

    async getAllProxies(
        networkType: EProxySellerNetworkType,
        country?: string
    ): Promise<IProxySellerProxy[]> {
        let proxies: IProxySellerProxy[];

        if (networkType === EProxySellerNetworkType.ALL) {
            const res = await this.instance.get<IProxySellerServerResponse<IProxySellerGetProxiesAll>>('proxy/list');
            const ipv4 = res.data.data.ipv4
                .filter((p) => p.status_type === EProxySellerProxyStatus.ACTIVE)
                .map((p) => {
                    p.networkType = EProxySellerNetworkType.IPV4;

                    return p;
                });
            const isp = res.data.data.isp
                .filter((p) => p.status_type === EProxySellerProxyStatus.ACTIVE)
                .map((p) => {
                    p.networkType = EProxySellerNetworkType.ISP;

                    return p;
                });
            const mobile = res.data.data.mobile
                .filter((p) => p.status_type === EProxySellerProxyStatus.ACTIVE)
                .map((p) => {
                    p.networkType = EProxySellerNetworkType.MOBILE;

                    return p;
                });

            proxies = [
                ...ipv4, ...isp, ...mobile,
            ];
        } else {
            const res = await this.instance.get<IProxySellerServerResponse<IProxySellerGetProxiesItems>>(`proxy/list/${networkType}`);

            proxies = res.data.data.items
                .filter((p) => p.status_type === EProxySellerProxyStatus.ACTIVE)
                .map((p) => {
                    p.networkType = networkType;

                    return p;
                });
        }

        if (country) {
            const countryUc = country.toUpperCase();
            proxies = proxies.filter((p) => p.country_alpha3 === countryUc);
        }

        return proxies;
    }

    async ping(): Promise<void> {
        await this.instance.get('system/ping');
    }
}
