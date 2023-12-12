import {
    Inject,
    Injectable,
} from '@nestjs/common';
import { SCRAPOXY_USER_AGENT } from '@scrapoxy/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { COMMANDER_REFRESH_CLIENT_MODULE_CONFIG } from './client.constants';
import { Agents } from '../../helpers';
import { catchError } from '../client.helpers';
import type { ICommanderRefreshClientModuleConfig } from './client.module';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorError,
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    ICreateRemoveLocalProxies,
    IFreeproxiesToRefresh,
    IFreeproxy,
    IFreeproxyRefreshed,
    INewFreeProxies,
    IProxiesToRefresh,
    IProxyMetricsAdd,
    IProxyRefreshed,
    ISelectedFreeproxies,
    ISynchronizeRemoteProxies,
    ITaskData,
    ITaskToUpdate,
    ITaskView,
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


@Injectable()
export class CommanderRefreshClientService implements OnModuleDestroy {
    private readonly instance: AxiosInstance;

    private readonly agents = new Agents();

    constructor(@Inject(COMMANDER_REFRESH_CLIENT_MODULE_CONFIG) private readonly config: ICommanderRefreshClientModuleConfig) {
        this.instance = axios.create({
            ...this.agents.axiosDefaults,
            baseURL: `${this.config.url}/refresh`,
            headers: {
                'User-Agent': SCRAPOXY_USER_AGENT,
            },
        });

        this.instance.interceptors.request.use(
            (cfg) => {
                const token = jwt.sign(
                    {},
                    this.config.jwt.secret,
                    {
                        expiresIn: this.config.jwt.expiration,
                    }
                );

                cfg.headers.Authorization = `Bearer ${token}`;

                return cfg;
            },
            (err: any) => {
                throw err;
            }
        );

        this.instance.interceptors.response.use(
            void 0,
            (err: any) => {
                if (err.response) {
                    catchError(err.response.data);
                }

                throw err;
            }
        );
    }

    onModuleDestroy() {
        this.agents.close();
    }

    //////////// PROJECTS ////////////
    async refreshProjectMetrics(): Promise<void> {
        await this.instance
            .post('projects/metrics');
    }

    //////////// CONNECTORS ////////////
    async setConnectorError(
        projectId: string,
        connectorId: string,
        error: string | null
    ): Promise<void> {
        const connector: IConnectorError = {
            error,
        };
        await this.instance
            .post<ISynchronizeRemoteProxies>(
            `projects/${projectId}/connectors/${connectorId}/error`,
            connector
        );
    }

    async getNextConnectorToRefresh(): Promise<IConnectorToRefresh> {
        const res = await this.instance
            .get<IConnectorToRefresh>('connectors/refresh');

        return res.data;
    }

    //////////// PROXIES ////////////
    async createAndRemoveConnectorProxies(
        projectId: string,
        connectorId: string,
        proxies: ICreateRemoveLocalProxies
    ): Promise<void> {
        await this.instance
            .put(
                `projects/${projectId}/connectors/${connectorId}/proxies`,
                proxies
            );
    }

    async refreshConnectorProxies(
        projectId: string,
        connectorId: string,
        proxies: IConnectorProxyRefreshed[]
    ): Promise<ISynchronizeRemoteProxies> {
        const res = await this.instance
            .post<ISynchronizeRemoteProxies>(
            `projects/${projectId}/connectors/${connectorId}/proxies`,
            proxies
        );

        return res.data;
    }

    async refreshProxies(remoteProxies: IProxyRefreshed[]): Promise<void> {
        await this.instance
            .post(
                'proxies/refresh',
                remoteProxies
            );
    }

    async addProxiesMetrics(proxies: IProxyMetricsAdd[]): Promise<void> {
        await this.instance
            .post(
                'proxies/metrics',
                proxies
            );
    }

    async getNextProxiesToRefresh(): Promise<IProxiesToRefresh> {
        const res = await this.instance.get<IProxiesToRefresh>('proxies/refresh');

        return res.data;
    }

    //////////// FREE PROXIES ////////////
    async getSelectedProjectFreeproxies(
        projectId: string,
        connectorId: string,
        keys: string[]
    ): Promise<IFreeproxy[]> {
        const query: ISelectedFreeproxies = {
            keys,
        };
        const res = await this.instance.post<IFreeproxy[]>(
            `projects/${projectId}/connectors/${connectorId}/freeproxies/selected`,
            query
        );

        return res.data;
    }

    async getNewProjectFreeproxies(
        projectId: string,
        connectorId: string,
        count: number,
        excludeKeys: string[]
    ): Promise<IFreeproxy[]> {
        const query: INewFreeProxies = {
            count,
            excludeKeys,
        };
        const res = await this.instance.post<IFreeproxy[]>(
            `projects/${projectId}/connectors/${connectorId}/freeproxies/new`,
            query
        );

        return res.data;
    }

    async getNextFreeproxiesToRefresh(): Promise<IFreeproxiesToRefresh> {
        const res = await this.instance.get<IFreeproxiesToRefresh>('freeproxies/refresh');

        return res.data;
    }

    async updateFreeproxies(remoteFreeproxies: IFreeproxyRefreshed[]): Promise<void> {
        await this.instance.post<IFreeproxy[]>(
            'freeproxies/refresh',
            remoteFreeproxies
        );
    }

    //////////// TASKS ////////////
    async updateTask(
        projectId: string, taskId: string, taskToUpdate: ITaskToUpdate
    ): Promise<ITaskView> {
        const res = await this.instance
            .put<ITaskView>(
            `projects/${projectId}/tasks/${taskId}`,
            taskToUpdate
        );

        return res.data;
    }

    async lockTask(
        projectId: string, taskId: string
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/tasks/${taskId}/lock`,
                {}
            );
    }

    async getNextTaskToRefresh(): Promise<ITaskData> {
        const res = await this.instance.get<ITaskData>('tasks/refresh');

        return res.data;
    }
}
