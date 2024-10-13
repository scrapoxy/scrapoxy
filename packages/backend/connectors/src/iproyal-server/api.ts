import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type {
    IIproyalServerOrder,
    IIproyalServerOrderDetail,
    IIproyalServerProxiesResponse,
    IIproyalServerProxy,
} from './iproyal-server.interface';
import type { AxiosInstance } from 'axios';


export class IproyalServerApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://dashboard.iproyal.com/api/servers/proxies/reseller',
            headers: {
                'X-Access-Token': `Bearer ${token}`,
            },
        });
    }

    async getAllProxies(
        product: string, country: string
    ): Promise<IIproyalServerProxy[]> {
        const orders = await this.getAllOrders();
        const
            promises: Promise<void>[] = [],
            proxies: IIproyalServerProxy[] = [];
        for (const order of orders) {
            const promise = (async() => {
                if (product !== 'all' &&
                    order.productName !== product) {
                    return;
                }

                if (country !== 'all') {
                    const detail = await this.getOrderById(order.id);

                    if (detail.location !== country) {
                        return;
                    }
                }

                const orderProxies = await this.getOrderProxiesById(order.id);
                for (const data of orderProxies.data) {
                    proxies.push(...data.proxies);
                }
            })();

            promises.push(promise);
        }

        await Promise.all(promises);

        const proxiesSorted = proxies.sort((
            a, b
        ) => a.id - b.id);

        return proxiesSorted;
    }

    async getMyProduct(): Promise<string[]> {
        const orders = await this.getAllOrders();
        const products = orders
            .map((order) => order.productName);
        const productsUnique = [
            ...new Set(products),
        ]
            .sort();

        return productsUnique;
    }

    async getMyCountries(): Promise<string[]> {
        const orders = await this.getAllOrders();
        const
            countries: string[] = [],
            promises: Promise<void>[] = [];
        for (const order of orders) {
            const promise = (async() => {
                const detail = await this.getOrderById(order.id);

                if (!countries.includes(detail.location)) {
                    countries.push(detail.location);
                }
            })();

            promises.push(promise);
        }

        await Promise.all(promises);

        return countries.sort();
    }

    private async getAllOrders(): Promise<IIproyalServerOrder[]> {
        const res = await this.instance.get<IIproyalServerOrder[]>(
            'orders?status[]=confirmed',
            {
                params: {
                    status: [
                        'confirmed',
                    ],
                },
            }
        );

        return res.data;
    }

    private async getOrderById(id: number): Promise<IIproyalServerOrderDetail> {
        const res = await this.instance.get<IIproyalServerOrderDetail>(`${id}/order`);

        return res.data;
    }

    private async getOrderProxiesById(id: number): Promise<IIproyalServerProxiesResponse> {
        const res = await this.instance.get<IIproyalServerProxiesResponse>(`${id}/credentials`);

        return res.data;
    }
}
