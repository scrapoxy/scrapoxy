import axios from 'axios';
import { Agents } from '../../helpers';
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
        const countries = res.data.map((c) => ({
            name: c.name,
            code: c.code,
        }));

        return countries;
    }
}
