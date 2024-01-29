import axios from 'axios';
import { Agents } from '../../helpers';
import type { IHypeproxyProxy } from './hypeproxy.interface';
import type { AxiosInstance } from 'axios';


export class HypeproxyApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.hypeproxy.io/Utils',
        });

        this.instance.interceptors.request.use((config) => {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;

            return config;
        });
    }

    async getInformations(): Promise<IHypeproxyProxy[]> {
        const res = await this.instance.get<IHypeproxyProxy[]>('GetInformations');

        return res.data;
    }

    async directRenewIp(id: string): Promise<void> {
        await this.instance.get<IHypeproxyProxy[]>(`DirectRenewIp/${id}`);
    }
}
