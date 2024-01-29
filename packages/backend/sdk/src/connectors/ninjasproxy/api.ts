import axios from 'axios';
import { Agents } from '../../helpers';
import type { INinjasproxyProxy } from './ninjasproxy.interface';
import type { AxiosInstance } from 'axios';


export class NinjasproxyApi {
    private readonly instance: AxiosInstance;

    constructor(
        apiKey: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.ninjasproxy.com/v1',
            params: {
                apiKey,
            },
        });
    }

    async getAllProxies(): Promise<INinjasproxyProxy[]> {

        const res = await this.instance.get<INinjasproxyProxy[]>('myProxies');

        return res.data;
    }
}
