import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import type { AxiosInstance } from 'axios';


export class ProxyLocalApi {
    private readonly instance: AxiosInstance;

    constructor(
        url: string,
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `${url}/api/`,
            headers: {
                Authorization: `Basic ${token}`,
            },
        });
    }

    async getAllSessions(): Promise<string[]> {
        const res = await this.instance.get<string[]>('sessions');

        return res.data;
    }

    async createSession(): Promise<string> {
        const res = await this.instance.post<string>(
            'sessions',
            {},
            {
                responseType: 'text',
            }
        );

        return res.data;
    }

    async removeSession(sessionId: string): Promise<void> {
        await this.instance.delete(`sessions/${sessionId}`);
    }
}
