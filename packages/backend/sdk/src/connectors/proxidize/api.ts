import axios from 'axios';
import { Agents } from '../../helpers';
import type { IProxidizeDevice } from './proxidize.interface';
import type { AxiosInstance } from 'axios';


export class ProxidizeApi {
    private readonly instance: AxiosInstance;

    constructor(
        url: string,
        apiToken: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: url,
            headers: {
                Authorization: `Token ${apiToken}`,
            },
        });
    }

    async getDevices(): Promise<IProxidizeDevice[]> {
        const res = await this.instance.get<IProxidizeDevice[]>('/api/getinfo');
        const devices = res.data
            .sort((
                a, b
            ) => a.Index - b.Index);

        return devices;
    }

    async rotateDevice(index: number): Promise<void> {
        await this.instance.get(
            '/api/change_ip',
            {
                params: {
                    index: index.toString(10),
                },
            }
        );
    }

    async rebootDevice(index: number): Promise<void> {
        await this.instance.get(
            '/api/reboot_modem',
            {
                params: {
                    index: index.toString(10),
                },
            }
        );
    }
}
