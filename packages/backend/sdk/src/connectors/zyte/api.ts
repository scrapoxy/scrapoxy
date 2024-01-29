import axios from 'axios';
import { Agents } from '../../helpers';
import type { AxiosInstance } from 'axios';


export class ZyteApi {
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
