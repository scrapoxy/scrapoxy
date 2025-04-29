import {
    Agents,
    Cache,
} from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type {
    IIproyalServerOrder,
    IIproyalServerOrderDetail,
    IIproyalServerProxiesResponse,
    IIproyalServerProxy,
} from './iproyal-server.interface';
import type { AxiosInstance } from 'axios';


export class IproyalServerApiError extends Error {
}

export class IproyalServerApi {
    private readonly instance: AxiosInstance;

    constructor(
        private readonly token: string,
        agents: Agents,
        private readonly cache: Cache
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

                try {
                    const orderProxies = await this.getOrderProxiesById(order.id);
                    for (const data of orderProxies.data) {
                        proxies.push(...data.proxies);
                    }
                } catch (err: any) {
                    if (!err.message?.includes('don\'t have any credentials')) {
                        throw err;
                    }
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
        // Check if we have the orders in cache
        const key = `${this.token}::iproyal-server-orders`;
        let orders: IIproyalServerOrder[] = await this.cache.get(key);

        if (!orders) {
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

            orders = res.data;

            // Cache the orders
            this.cache.set(
                key,
                orders
            );
        }

        return orders;
    }

    private async getOrderById(id: number): Promise<IIproyalServerOrderDetail> {
        // Check if we have the order in cache
        const key = `${this.token}::iproyal-server-order::${id}`;
        let order: IIproyalServerOrderDetail = await this.cache.get(key);

        if (!order) {
            const res = await this.instance.get<IIproyalServerOrderDetail>(`${id}/order`);

            order = res.data;

            // Cache the order
            this.cache.set(
                key,
                order
            );
        }

        return order;
    }

    private async getOrderProxiesById(id: number): Promise<IIproyalServerProxiesResponse> {
        // Check if we have the proxies in cache
        const key = `${this.token}::iproyal-server-proxies-${id}`;
        let proxies: IIproyalServerProxiesResponse = await this.cache.get(key);

        if (!proxies) {
            const res = await this.instance.get<IIproyalServerProxiesResponse>(`${id}/credentials`);

            proxies = res.data;

            // Cache the proxies
            this.cache.set(
                key,
                proxies
            );
        }

        if (typeof proxies === 'string') {
            throw new IproyalServerApiError(`Error: ${proxies}`);
        }

        return proxies;
    }
}
