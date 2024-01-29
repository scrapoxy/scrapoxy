import { Agent } from 'https';
import { Retry } from '@scrapoxy/common';
import axios, { AxiosError } from 'axios';
import {
    formatUsername,
    productToHostname,
} from './proxyrack.helpers';
import { EProxyrackProductType } from './proxyrack.interface';
import { Agents } from '../../helpers';
import type {
    IProxyrackSession,
    IProxyrackSessionOptions,
} from './proxyrack.interface';
import type {
    AxiosInstance,
    AxiosResponse,
} from 'axios';


export const DEFAULT_PROXYRACK_PORT = 10000;


export class ProxyrackError extends Error {
    constructor(
        public status: number,
        public statusText: string
    ) {
        super(`${statusText} (API code ${status})`);
    }
}


export class ProxyrackApi {
    private readonly instance: AxiosInstance;

    private readonly proxyHost: string;

    private readonly agent: Agent;

    constructor(
        product: EProxyrackProductType,
        private readonly username: string,
        private readonly password: string,
        agents: Agents
    ) {
        this.proxyHost = productToHostname(product);

        this.agent = new Agent({
            rejectUnauthorized: false,
        });

        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'http://api.proxyrack.net',
        });

        this.instance.interceptors.response.use(
            (response) => response,
            (err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;

                    throw new ProxyrackError(
                        response.status,
                        response.statusText
                    );
                }

                throw err;
            }
        );
    }

    @Retry()
    async listAllSessions(): Promise<IProxyrackSession[]> {
        const res = await this.instance.get<IProxyrackSession[]>(
            'sessions',
            {
                proxy: {
                    host: this.proxyHost,
                    port: DEFAULT_PROXYRACK_PORT,
                    auth: {
                        username: this.username,
                        password: this.password,
                    },
                },
            }
        );
        const sessions = res.data
            .filter((s) => s.session && s.session.length > 0);

        return sessions;
    }

    @Retry()
    async listCountries(): Promise<string[]> {
        const res = await this.instance.get<string[]>(
            'countries',
            {
                proxy: {
                    host: this.proxyHost,
                    port: DEFAULT_PROXYRACK_PORT,
                    auth: {
                        username: this.username,
                        password: this.password,
                    },
                },
            }
        );
        const countries = res.data
            .filter((c) => c && c.length > 0)
            .map((c) => c.toUpperCase());

        return countries;
    }

    @Retry()
    async listCities(country: string): Promise<string[]> {
        const res = await this.instance.get<string[]>(
            `countries/${country.toUpperCase()}/cities`,
            {
                proxy: {
                    host: this.proxyHost,
                    port: DEFAULT_PROXYRACK_PORT,
                    auth: {
                        username: this.username,
                        password: this.password,
                    },
                },
            }
        );

        return res.data;
    }

    @Retry()
    async listIsps(country: string): Promise<string[]> {
        const res = await this.instance.get<string[]>(
            `countries/${country.toUpperCase()}/isps`,
            {
                proxy: {
                    host: this.proxyHost,
                    port: DEFAULT_PROXYRACK_PORT,
                    auth: {
                        username: this.username,
                        password: this.password,
                    },
                },
            }
        );

        return res.data;
    }

    @Retry()
    async getProxiesCountByCountry(country: string): Promise<number> {
        const res = await this.instance.get<number>(
            `countries/${country.toUpperCase()}/count`,
            {
                proxy: {
                    host: this.proxyHost,
                    port: DEFAULT_PROXYRACK_PORT,
                    auth: {
                        username: this.username,
                        password: this.password,
                    },
                },
            }
        );

        return res.data;
    }

    async createSession(options: IProxyrackSessionOptions): Promise<void> {
        const username = formatUsername(
            this.username,
            options
        );

        try {
            await this.instance.get(
                'https://fingerprint.scrapoxy.io/api/json',
                {
                    proxy: {
                        host: this.proxyHost,
                        port: DEFAULT_PROXYRACK_PORT,
                        auth: {
                            username,
                            password: this.password,
                        },
                    },
                    httpsAgent: this.agent,
                }
            );
        } catch (err: any) {
            if (err.response && err.response.status === 562) {
                // Ignore proxy not found response
            } else {
                throw err;
            }
        }
    }

    async deleteSession(options: IProxyrackSessionOptions): Promise<void> {
        const username = formatUsername(
            this.username,
            options
        );

        await this.instance.get(
            'release',
            {
                proxy: {
                    host: this.proxyHost,
                    port: DEFAULT_PROXYRACK_PORT,
                    auth: {
                        username,
                        password: this.password,
                    },
                },
            }
        );
    }
}
