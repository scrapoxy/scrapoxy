import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type { AxiosInstance } from 'axios';


export class ZyteSmartProxyManagerApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'http://proxy.zyte.com:8011',
            auth: {
                username: token,
                password: '',
            },
        });
    }

    async getAllSessions(): Promise<string[]> {
        const res = await this.instance.get<{ [key: string]: string | null }>('/sessions');

        return Object.keys(res.data);
    }

    async createSession(): Promise<string> {
        const res = await this.instance.post<string>(
            '/sessions',
            {},
            {
                responseType: 'text',
            }
        );

        return res.data;
    }

    async removeSession(sessionId: string): Promise<void> {
        await this.instance.delete(`/sessions/${sessionId}`);
    }
}


export class ZyteApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.zyte.com/v1',
            auth: {
                username: token,
                password: '',
            },
        });
    }

    async testToken(): Promise<boolean> {
        try {
            await this.instance.post(
                'extract',
                {}
            );

            return true;
        } catch (err: any) {
            return err.response?.status === 400;
        }
    }
}
