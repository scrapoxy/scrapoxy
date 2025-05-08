import { Agents } from '@scrapoxy/backend-sdk';
import axios, { AxiosError } from 'axios';
import type {
    IScalewayCreateInstancesRequest,
    IScalewayError,
    IScalewayInstance,
} from './scaleway.interface';
import type { IScalewayInstanceType } from '@scrapoxy/common';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';


export class ScalewayError extends Error {
    constructor(
        public errorClass: string,
        message: string
    ) {
        super(message);
    }
}


export class ScalewayApi {
    private readonly instance: AxiosInstance;

    constructor(
        secretAccessKey: string,
        region: string,
        private readonly projectId: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `https://api.scaleway.com/instance/v1/zones/${region}`,
            headers: {
                'X-Auth-Token': secretAccessKey,
            },
        });

        this.instance.interceptors.response.use(
            (r) => r,
            (err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;
                    const error = response?.data as IScalewayError;

                    if (error) {
                        const message = `${error.message} ${response.request.path}\n${response.data})`;

                        throw new ScalewayError(
                            error.class,
                            message
                        );
                    }
                }

                throw err;
            }
        );
    }

    //////////// INSTANCE TYPES ////////////
    public async listInstanceTypes(maxHourlyPrice: number): Promise<IScalewayInstanceType[]> {
        const res = await this.instance.get(
            'products/servers',
            {
                params: {
                    per_page: 100,
                },
            }
        );
        const instanceTypes: IScalewayInstanceType[] = [];

        for (const [
            name, value,
        ] of Object.entries(res.data.servers)) {
            const hourlyPrice = (value as any).hourly_price;

            if (hourlyPrice < maxHourlyPrice) {
                instanceTypes.push({
                    name,
                    hourlyPrice,
                });
            }
        }

        return instanceTypes;
    }

    //////////// INSTANCES ////////////
    public async listInstances(tags?: string): Promise<IScalewayInstance[]> {
        const config: AxiosRequestConfig = {
            params: {
                project: this.projectId,
            },
        };

        if (tags) {
            config.params.tags = tags;
        }

        const instances = await this.instance.get(
            'servers',
            config
        )
            .then((r) => r.data.servers);

        return instances;
    }

    public async getInstance(instanceId: string): Promise<IScalewayInstance> {
        const instance = await this.instance.get<{ server: IScalewayInstance }>(`servers/${instanceId}`)
            .then((r) => r.data.server);

        return instance;
    }

    public async createInstance(request: IScalewayCreateInstancesRequest): Promise<IScalewayInstance> {
        request.project = this.projectId;

        request.volumes = {
            0: {
                size: 10000000000,
                volume_type: 'sbs_volume',
            },
        };

        const instance = await this.instance.post<{ server: IScalewayInstance }>(
            'servers',
            request
        )
            .then((r) => r.data.server);

        return instance;
    }

    public async startInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `servers/${instanceId}/action`,
            {
                action: 'poweron',
            }
        );
    }

    public async terminateInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `servers/${instanceId}/action`,
            {
                action: 'terminate',
            }
        );
    }

    public async setUserData(
        instanceId: string, userData: string
    ) {
        await this.instance.patch(
            `servers/${instanceId}/user_data/cloud-init`,
            userData,
            {
                headers: {
                    'Content-Type': 'text/plain',
                },
            }
        );
    }
}
