import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type { IIproyalResidentialCountries } from '@scrapoxy/connector-iproyal-residential-sdk';
import type { AxiosInstance } from 'axios';


export class IproyalResidentialApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://dashboard.iproyal.com/api/residential/royal/reseller',
            headers: {
                'X-Access-Token': `Bearer ${token}`,
            },
        });
    }

    async getAllCountries(): Promise<IIproyalResidentialCountries> {
        const res = await this.instance.get<IIproyalResidentialCountries>('access/countries');

        return res.data;
    }

    async generateProxyList(
        username: string, password: string
    ): Promise<string[]> {
        const res = await this.instance.post<string[]>(
            'access/generate-proxy-list',
            {
                username,
                password,
                proxyCount: 1,
            }
        );

        return res.data;
    }
}
