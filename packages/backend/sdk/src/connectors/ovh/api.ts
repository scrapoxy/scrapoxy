import axios, { AxiosError } from 'axios';
import { EOvhInstanceStatus } from './ovh.interface';
import { OvhSignature } from './signature';
import { Agents } from '../../helpers';
import type {
    IOvhCreateInstancesRequest,
    IOvhError,
    IOvhFlavor,
    IOvhImage,
    IOvhInstance,
    IOvhProject,
    IOvhRegion,
    IOvhSnapshot,
} from './ovh.interface';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';


export class OvhError extends Error {
    constructor(
        public errorClass: string,
        message: string
    ) {
        super(message);
    }
}


/**
 * Ovh API client.
 * Needs the following rights:
 * - GET cloud/project
 * - GET+POST+DELETE cloud/project/{projectId}/*
 */
export class OvhApi {
    private readonly instance: AxiosInstance;

    constructor(
        appKey: string,
        appSecret: string,
        consumerKey: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: 'https://api.ovh.com/1.0',
        });

        const signature = new OvhSignature(
            appKey,
            appSecret,
            consumerKey
        );

        this.instance.interceptors.request.use((config) => {
            signature.sign(config);

            return config;
        });

        this.instance.interceptors.response.use(
            (response) => response,
            (err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;
                    const error = response?.data as IOvhError;

                    if (error) {
                        let message: string;

                        if (error.class === 'Client::Forbidden') {
                            message = `${error.message} (${response.request.method} ${response.request.path})`;
                        } else {
                            message = error.message;
                        }

                        throw new OvhError(
                            error.class,
                            message
                        );
                    }
                }

                throw err;
            }
        );
    }

    //////////// PROJECTS ////////////
    async getAllProjectsIds(): Promise<string[]> {
        const response = await this.instance.get<string[]>('cloud/project');

        return response.data;
    }

    async getProject(projectId: string): Promise<IOvhProject> {
        const response = await this.instance.get<IOvhProject>(`cloud/project/${projectId}`);

        return response.data;
    }

    //////////// REGIONS ////////////
    async getAllRegionsIds(projectId: string): Promise<string[]> {
        const response = await this.instance.get<string[]>(`cloud/project/${projectId}/region`);

        return response.data;
    }

    async getRegion(
        projectId: string, region: string
    ): Promise<IOvhRegion> {
        const response = await this.instance.get<IOvhRegion>(`cloud/project/${projectId}/region/${region}`);

        return response.data;
    }

    //////////// FLAVORS ////////////
    async getAllFlavors(
        projectId: string, region: string
    ): Promise<IOvhFlavor[]> {
        const response = await this.instance.get<IOvhFlavor[]>(
            `cloud/project/${projectId}/flavor`,
            {
                params: {
                    region,
                },
            }
        );

        return response.data;
    }

    //////////// INSTANCES ////////////
    async getAllInstances(
        projectId: string, region?: string
    ): Promise<IOvhInstance[]> {
        const config: AxiosRequestConfig = {};

        if (region && region.length > 0) {
            config.params = {
                region,
            };
        }

        const response = await this.instance.get<IOvhInstance[]>(
            `cloud/project/${projectId}/instance`,
            config
        );
        const instances = response.data;

        return instances.filter((f) => f.status !== EOvhInstanceStatus.DELETED);
    }

    async getInstance(
        projectId: string, instanceId: string
    ): Promise<IOvhInstance> {
        const response = await this.instance.get<IOvhInstance>(`cloud/project/${projectId}/instance/${instanceId}`);

        return response.data;
    }

    async createInstances(request: IOvhCreateInstancesRequest): Promise<IOvhInstance[]> {
        const payload: { [key: string]: any } = {
            name: request.name,
            region: request.region,
            flavorId: request.flavorId,
            imageId: request.imageId,
        };

        if (request.userData && request.userData.length > 0) {
            payload.userData = request.userData;
        }

        if (request.count > 1) {
            payload.number = request.count;

            const response = await this.instance.post<IOvhInstance[]>(
                `cloud/project/${request.projectId}/instance/bulk`,
                payload
            );

            return response.data;
        } else {
            const response = await this.instance.post<IOvhInstance>(
                `cloud/project/${request.projectId}/instance`,
                payload
            );

            return [
                response.data,
            ];
        }
    }

    async startInstance(
        projectId: string,
        instanceId: string
    ): Promise<void> {
        await this.instance.post(
            `cloud/project/${projectId}/instance/${instanceId}/start`,
            {}
        );
    }

    async stopInstance(
        projectId: string,
        instanceId: string
    ): Promise<void> {
        await this.instance.post(
            `cloud/project/${projectId}/instance/${instanceId}/stop`,
            {}
        );
    }

    async snapshotInstance(
        projectId: string,
        instanceId: string,
        snapshotName: string
    ): Promise<void> {
        const payload = {
            snapshotName,
        };

        await this.instance.post(
            `cloud/project/${projectId}/instance/${instanceId}/snapshot`,
            payload
        );
    }

    async removeInstance(
        projectId: string,
        instanceId: string
    ): Promise<void> {
        await this.instance.delete(`cloud/project/${projectId}/instance/${instanceId}`);
    }

    //////////// SNAPSHOTS ////////////
    async getAllSnapshots(
        projectId: string, region: string
    ): Promise<IOvhSnapshot[]> {
        const response = await this.instance.get<IOvhSnapshot[]>(
            `cloud/project/${projectId}/snapshot`,
            {
                params: {
                    region,
                },
            }
        );

        return response.data;
    }

    async getSnapshot(
        projectId: string, snapshotId: string
    ): Promise<IOvhSnapshot> {
        const response = await this.instance.get<IOvhSnapshot>(`cloud/project/${projectId}/snapshot/${snapshotId}`);

        return response.data;
    }

    async removeSnapshot(
        projectId: string, snapshotId: string
    ): Promise<void> {
        await this.instance.delete(`cloud/project/${projectId}/snapshot/${snapshotId}`);
    }

    //////////// IMAGES ////////////
    async getAllImages(
        projectId: string, region: string
    ): Promise<IOvhImage[]> {
        const response = await this.instance.get<IOvhImage[]>(
            `cloud/project/${projectId}/image`,
            {
                params: {
                    region,
                },
            }
        );

        return response.data;
    }
}
