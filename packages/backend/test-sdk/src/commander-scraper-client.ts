import {
    EProjectStatus,
    SCRAPOXY_USER_AGENT,
} from '@scrapoxy/common';
import axios from 'axios';
import type {
    IConnectorProxiesView,
    IProjectStatus,
    IProjectView,
    IProxyIdToRemove,
    IUserView,
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


export class CommanderScraperClient {
    private readonly instance: AxiosInstance;

    constructor(
        apiUrl: string,
        tokenB64: string
    ) {
        this.instance = axios.create({
            baseURL: `${apiUrl}/scraper`,
            headers: {
                'User-Agent': SCRAPOXY_USER_AGENT,
                Authorization: `Basic ${tokenB64}`,
            },
        });
    }

    //////////// PROJECTS ////////////
    async getProject(): Promise<IProjectView> {
        const res = await this.instance.get<IProjectView>('project');

        return res.data;
    }

    async setProjectStatus(status: EProjectStatus): Promise<void> {
        const payload: IProjectStatus = {
            status,
        };

        await this.instance.post<IUserView>(
            'project/status',
            payload
        );
    }

    //////////// CONNECTORS ////////////
    async getAllProjectConnectorsAndProxies(): Promise<IConnectorProxiesView[]> {
        const res = await this.instance.get<IConnectorProxiesView[]>('project/connectors');

        return res.data;
    }

    //////////// PROXIES ////////////
    async askProxiesToRemove(proxiesIds: IProxyIdToRemove[]): Promise<void> {
        await this.instance.post<IUserView>(
            'project/proxies/remove',
            proxiesIds
        );
    }
}
