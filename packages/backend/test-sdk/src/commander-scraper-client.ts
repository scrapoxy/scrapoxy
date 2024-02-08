import { EProjectStatus } from '@scrapoxy/common';
import axios from 'axios';
import type {
    IConnectorProxiesView,
    IFreeproxiesToRemoveOptions,
    IFreeproxy,
    IFreeproxyBase,
    IProjectStatus,
    IProjectView,
    IProxyIdToRemove,
    ISource,
    ISourceBase,
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


export class CommanderScraperClient {
    private readonly instance: AxiosInstance;

    constructor(
        apiUrl: string,
        useragent: string,
        tokenB64: string
    ) {
        this.instance = axios.create({
            baseURL: `${apiUrl}/scraper`,
            headers: {
                'User-Agent': useragent,
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

        await this.instance.post(
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
        await this.instance.post(
            'project/proxies/remove',
            proxiesIds
        );
    }

    //////////// FREE PROXIES ////////////
    async getAllProjectFreeproxiesById(connectorId: string): Promise<IFreeproxy[]> {
        const res = await this.instance.get<IFreeproxy[]>(`project/connectors/${connectorId}/freeproxies`);

        return res.data;
    }

    async createFreeproxies(
        connectorId: string, freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        await this.instance.post(
            `project/connectors/${connectorId}/freeproxies`,
            freeproxies
        );
    }

    async removeFreeproxies(
        connectorId: string, options?: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        await this.instance.post(
            `project/connectors/${connectorId}/freeproxies/remove`,
            options
        );
    }

    async getAllProjectSourcesById(connectorId: string): Promise<ISource[]> {
        const res = await this.instance.get<ISource[]>(`project/connectors/${connectorId}/sources`);

        return res.data;
    }

    async createSources(
        connectorId: string, sources: ISourceBase[]
    ): Promise<void> {
        await this.instance.post(
            `project/connectors/${connectorId}/sources`,
            sources
        );
    }

    async removeSources(
        connectorId: string, ids: string[]
    ): Promise<void> {
        await this.instance.post(
            `project/connectors/${connectorId}/sources/remove`,
            ids
        );
    }
}
