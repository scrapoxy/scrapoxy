import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type {
    INimblewayCountry,
    INimblewayGeoItem,
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


export class NimblewayApi {
    private readonly instance: AxiosInstance;

    constructor(agents: Agents) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.nimbleway.com/api/v1',
        });
    }

    async listCountries(): Promise<INimblewayGeoItem[]> {
        const res = await this.instance.get<INimblewayCountry[]>('location/cities');

        return res.data;
    }
}
