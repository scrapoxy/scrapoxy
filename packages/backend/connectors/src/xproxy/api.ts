import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type {
    IXProxyData,
    IXProxyDevice,
} from './xproxy.interface';
import type { AxiosInstance } from 'axios';


export class XproxyApi {
    private readonly instance: AxiosInstance;

    constructor(
        url: string,
        username: string,
        password: string,
        agents: Agents
    ) {
        const auth = Buffer.from(`${username}:${password}`)
            .toString('base64');

        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `${url}/api/v1`,
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
    }

    async getDevices(): Promise<IXProxyDevice[]> {
        const res = await this.instance.get<IXProxyData<IXProxyDevice[]>>(
            'info_list',
            {
                params: {
                    limit: 1000,
                },
            }
        );
        const devices = res.data.data
            .sort((
                a, b
            ) => a.position - b.position);

        return devices;
    }

    async rotateDevice(position: number): Promise<void> {
        await this.instance.get(`rotate_ip/position/${position}`);
    }

    async rebootDevice(position: number): Promise<void> {
        await this.instance.get(`reboot/position/${position}`);
    }
}
