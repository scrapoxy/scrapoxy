import {
    Inject,
    Injectable,
} from '@nestjs/common';
import { EConnectMode } from '@scrapoxy/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { COMMANDER_MASTER_CLIENT_MODULE_CONFIG } from './client.constants';
import { Agents } from '../../helpers';
import { catchError } from '../client.helpers';
import type { ICommanderMasterClientModuleConfig } from './client.module';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IProjectToConnect,
    IProjectToConnectQuery,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


@Injectable()
export class CommanderMasterClientService implements OnModuleDestroy {
    private readonly instance: AxiosInstance;

    private readonly instanceAuth: AxiosInstance;

    private readonly agents = new Agents();

    constructor(@Inject(COMMANDER_MASTER_CLIENT_MODULE_CONFIG)
    private readonly config: ICommanderMasterClientModuleConfig) {
        // Instance without bearer token
        this.instance = axios.create({
            ...this.agents.axiosDefaults,
            baseURL: `${this.config.url}/master`,
            headers: {
                'User-Agent': config.useragent,
            },
        });

        this.instance.interceptors.response.use(
            void 0,
            (err: any) => {
                if (err.response) {
                    catchError(err.response.data);
                }

                throw err;
            }
        );

        // Instance with bearer token
        this.instanceAuth = axios.create({
            ...this.agents.axiosDefaults,
            baseURL: `${this.config.url}/master`,
            headers: {
                'User-Agent': this.config.useragent,
            },
        });

        this.instanceAuth.interceptors.request.use(
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

        this.instanceAuth.interceptors.response.use(
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
    async getProjectToConnect(
        token: string,
        mode: EConnectMode,
        certificateHostname: string | null
    ): Promise<IProjectToConnect> {
        const query: IProjectToConnectQuery = {
            mode,
            certificateHostname,
        };
        const res = await this.instance.post<IProjectToConnect>(
            'projects',
            query,
            {
                headers: {
                    'Proxy-Authorization': `Basic ${token}`,
                },
            }
        );

        return res.data;
    }

    async scaleUpProject(projectId: string): Promise<void> {
        await this.instanceAuth.post(
            `projects/${projectId}/scaleup`,
            {}
        );
    }

    //////////// PROXIES ////////////
    async getNextProxyToConnect(
        projectId: string,
        proxyname: string | null
    ): Promise<IProxyToConnect> {
        const params: any = {};

        if (proxyname) {
            params.proxyname = proxyname;
        }

        const res = await this.instanceAuth.get<IProxyToConnect>(
            `projects/${projectId}/proxy`,
            {
                params,
            }
        );

        return res.data;
    }
}
