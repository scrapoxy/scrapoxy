import {
    Agents,
    Cache,
} from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type {
    IIproyalServerOrder,
    IIproyalServerProxiesResponse,
} from './iproyal-server.interface';
import type { AxiosInstance } from 'axios';


const
    PAGE_MIN = 1,
    PER_PAGE = 10000;


export class IproyalServerApi {
    private readonly instance: AxiosInstance;

    constructor(
        private readonly token: string,
        agents: Agents,
        private readonly cache: Cache
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://apid.iproyal.com/v1/reseller',
            headers: {
                'X-Access-Token': token,
            },
        });
    }

    async getMyCountries(productId: number): Promise<string[]> {
        const orders = await this.getAllOrders(productId);
        const countries =
            orders.map((c) => c.location);

        return Array.from(new Set(countries));
    }

    async getBalance(): Promise<number> {
        const res = await this.instance.get<number>('/balance');

        return res.data;
    }

    async getAllOrders(productId: number): Promise<IIproyalServerOrder[]> {
        // Check if we have the orders in cache
        const key = `${this.token}::iproyal-server-orders::${productId}`;
        let orders: IIproyalServerOrder[] = await this.cache.get(key);

        if (!orders) {
            const res = await this.instance.get<IIproyalServerProxiesResponse<IIproyalServerOrder[]>>(
                'orders',
                {
                    params: {
                        product_id: productId,
                        page: PAGE_MIN,
                        per_page: PER_PAGE,
                        status: 'confirmed',
                    },
                }
            );

            orders = res.data.data;

            // Cache the orders
            this.cache.set(
                key,
                orders
            );
        }

        return orders;
    }
}
