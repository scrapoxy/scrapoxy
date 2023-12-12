import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type {
    IIproyalOrder,
    IIproyalOrderDetail,
    IIproyalProxiesResponse,
    IIproyalProxy,
} from './iproyal.interface';
import type { AxiosInstance } from 'axios';


export class IproyalApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://dashboard.iproyal.com/api',
            headers: {
                'X-Access-Token': `Bearer ${token}`,
            },
        });
    }

    async getAllProxies(
        product: string, country: string
    ): Promise<IIproyalProxy[]> {
        const orders = await this.getAllOrders();
        const
            promises: Promise<void>[] = [],
            proxies: IIproyalProxy[] = [];
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

                const credentials = await this.getOrderProxiesById(order.id);

                proxies.push(...credentials);
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

    private async getAllOrders(): Promise<IIproyalOrder[]> {
        const res = await this.instance.get<IIproyalOrder[]>(
            'servers/proxies/reseller/orders?status[]=confirmed',
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

    private async getOrderById(id: number): Promise<IIproyalOrderDetail> {
        const res = await this.instance.get<IIproyalOrderDetail>(`servers/proxies/reseller/${id}/order`);

        return res.data;
    }

    private async getOrderProxiesById(id: number): Promise<IIproyalProxy[]> {
        const res = await this.instance.get<IIproyalProxiesResponse>(`servers/proxies/reseller/${id}/credentials`);

        return res.data.data;
    }
}
