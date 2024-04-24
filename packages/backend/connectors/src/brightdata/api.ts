import { Agents } from '@scrapoxy/backend-sdk';
import { sleep } from '@scrapoxy/common';
import axios from 'axios';
import type {
    IBrightdataStatus,
    IBrightdataZoneData,
    IBrightdataZoneView,
} from './brightdata.interface';
import type { AxiosInstance } from 'axios';


const DELAY = 1000;


export class BrightdataApi {
    private readonly instance: AxiosInstance;

    private lastRequestTime = 0;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.brightdata.com',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        this.instance.interceptors.request.use(async(config) => {
            const diff = Date.now() - this.lastRequestTime;

            if (diff < DELAY) {
                await sleep(DELAY - diff);
            }

            return config;
        });

        this.instance.interceptors.response.use(
            (res) => {
                this.lastRequestTime = Date.now();

                return res;
            },
            (err) => {
                this.lastRequestTime = Date.now();

                throw err;
            }
        );
    }

    async getStatus(): Promise<IBrightdataStatus> {
        const res = await this.instance.get<IBrightdataStatus>('status');

        return res.data;
    }

    async getAllActiveZones(): Promise<IBrightdataZoneView[]> {
        const res = await this.instance.get<IBrightdataZoneView[]>('zone/get_active_zones');

        return res.data;
    }

    async getZone(zone: string): Promise<IBrightdataZoneData> {
        const res = await this.instance.get<IBrightdataZoneData>(
            'zone',
            {
                params: {
                    zone,
                },
            }
        );

        return res.data;
    }

    async getZoneRouteIps(zone: string): Promise<string[]> {
        const res = await this.instance.get<string>(
            'zone/route_ips',
            {
                params: {
                    zone,
                },
            }
        );
        const ips = res.data.split('\n');

        return ips;
    }

    async refreshStaticIps(
        zone: string,
        ips: string[],
        country?: string
    ): Promise<void> {
        const payload: any = {
            zone,
            ips,
        };

        if (country && country.length > 0) {
            payload.country = country;
        }

        await this.instance.post(
            'zone/ips/refresh',
            payload
        );
    }
}
