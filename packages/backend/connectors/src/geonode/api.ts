import { Agents } from '@scrapoxy/backend-sdk';
import { EGeonodeProductType } from '@scrapoxy/common';
import axios from 'axios';
import type { IIsocodeCountry } from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


export class GeonodeApi {
    private readonly instance: AxiosInstance;

    constructor(
        username: string,
        password: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://monitor.geonode.com',
            auth: {
                username,
                password,
            },
        });
    }

    async getCountries(productType: EGeonodeProductType): Promise<IIsocodeCountry[]> {
        const res = await this.instance.get<IIsocodeCountry[]>(`services/geo-target/${productType.toUpperCase()}`);
        const countries = res.data.map((c) => ({
            code: c.code,
            name: c.name,
        }));

        return countries;
    }

    async releaseSessionByPorts(
        productType: EGeonodeProductType, ports: number[]
    ) {
        await this.instance.put(
            `sessions/release/${productType.toUpperCase()}`,
            {
                data: ports.map((port) => ({
                    port,
                })),
            }
        );
    }
}
