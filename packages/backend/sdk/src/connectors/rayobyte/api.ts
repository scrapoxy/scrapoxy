import axios from 'axios';
import { Agents } from '../../helpers';
import type { IAvailableReplacement } from './rayobyte.interface';
import type { AxiosInstance } from 'axios';


export class RayobyteApiError extends Error {}


export class RayobyteApi {
    private readonly instance: AxiosInstance;

    constructor(
        private readonly email: string,
        private readonly apiKey: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://rayobyte.com/proxy/dashboard/api',
        });
    }

    async exportProxies(packageFilter: string): Promise<string[]> {
        const res = await this.instance.get<string>(`export/4/${packageFilter}/${this.email}/${this.apiKey}/list.csv`);
        const lines = res.data.split('\n');
        const proxies = lines
            .filter((p) => !!p);

        return proxies;
    }

    async getAvailableReplacements(): Promise<IAvailableReplacement[]> {
        const res = await this.instance.get<IAvailableReplacement[]>(`available-replacements/${this.email}/${this.apiKey}`);

        return res.data;
    }

    async replaceProxies(ips: string[]): Promise<void> {
        const res = await this.instance.get(`replace-multiple-ips/${this.email}/${this.apiKey}?replace=${ips.join(',')}`);

        if (res.data.status !== 'ok') {
            throw new RayobyteApiError('Cannot replace proxies: status error');
        }

        const ipsReplaced = res.data.ip;

        if (ips.length !== ipsReplaced.length) {
            throw new RayobyteApiError('Cannot replace proxies: wrong ips count in result');
        }
    }
}
