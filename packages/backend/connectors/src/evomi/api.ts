import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import {
    isValidResidentialProduct,
    isValidServerProduct,
} from './evomi.helpers';
import type {
    IEvomiProductResidential,
    IEvomiProductServer,
} from './evomi.interface';
import type { AxiosInstance } from 'axios';


export class EvomiApi {
    private readonly instance: AxiosInstance;

    constructor(
        apiKey: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.evomi.com/',
            headers: {
                'x-apikey': apiKey,
            },
        });
    }


    async getAllProducts(): Promise<string[]> {
        const res = await this.instance.get('public');
        const products = res.data.products;

        if (!products) {
            return [];
        }

        const productsFiltered: string[] = [];
        for (const [
            key, value,
        ] of Object.entries(products)) {
            if (key === 'static_residential') {
                if (isValidServerProduct(value as any)) {
                    productsFiltered.push(key);
                }
            } else {
                if (isValidResidentialProduct(value as any)) {
                    productsFiltered.push(key);
                }
            }
        }

        return productsFiltered;
    }

    async getProductResidential(product: string): Promise<IEvomiProductResidential | IEvomiProductServer | undefined> {
        const res = await this.instance.get('public');
        const products = res.data.products;

        if (!products) {
            return;
        }

        return products[ product ] as IEvomiProductResidential | IEvomiProductServer;
    }

    async getCountriesCodeByProduct(product: string): Promise<string[]> {
        const res = await this.instance.get('public/settings');
        const products = res.data.data;

        if (!products) {
            return [];
        }

        const countries = products[ product ]?.countries;

        if (!countries || typeof countries !== 'object') {
            return [];
        }

        return Object.keys(countries)
            .map((key) => key.toLowerCase());
    }
}
