import { Agents } from '@scrapoxy/backend-sdk';
import axios, { AxiosError } from 'axios';
import type {
    IScalewayCreateInstancesRequest,
    IScalewayError,
    IScalewayExtraVolume,
    IScalewayImage,
    IScalewayInstance,
    IScalewaySnapshot,
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
                volume_type: 'b_ssd',
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

    public async stopInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `servers/${instanceId}/action`,
            {
                action: 'poweroff',
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

    public async deleteInstance(instanceId: string): Promise<void> {
        await this.instance.delete(`servers/${instanceId}`);
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

    //////////// VOLUMES ////////////
    public async listVolumes(): Promise<IScalewayExtraVolume[]> {
        return await this.instance.get(
            'volumes',
            {
                params: {
                    project: this.projectId,
                },
            }
        )
            .then((res) => res.data.volumes);
    }

    public async deleteVolume(volumeId: string): Promise<void> {
        await this.instance.delete(`volumes/${volumeId}`);
    }

    //////////// SNAPSHOTS ////////////
    public async listSnapshots(): Promise<IScalewaySnapshot[]> {
        const response = await this.instance.get(
            'snapshots',
            {
                params: {
                    project: this.projectId,
                },
            }
        )
            .then((r) => r.data.snapshots);

        return response;
    }

    public async getSnapshot(snapshotId: string): Promise<IScalewaySnapshot> {
        const response = await this.instance.get(`snapshots/${snapshotId}`)
            .then((r) => r.data.snapshot);

        return response;
    }

    public async createSnapshot(
        volumeId: string, snapshotName: string
    ): Promise<IScalewaySnapshot> {
        const snapshot = await this.instance.post(
            'snapshots',
            {
                project: this.projectId,
                volume_id: volumeId,
                name: snapshotName,
            }
        )
            .then((r) => r.data.snapshot);

        return snapshot;
    }

    public async deleteSnapshot(snapshotId: string): Promise<void> {
        await this.instance.delete(`snapshots/${snapshotId}`);
    }

    //////////// IMAGES ////////////
    public async listImages(): Promise<IScalewayImage[]> {
        const response = await this.instance.get(
            'images',
            {
                params: {
                    project: this.projectId,
                },
            }
        )
            .then((r) => r.data.images);

        return response;
    }

    public async createImage(
        imageName: string, snapshotId: string, arch: string
    ): Promise<IScalewayImage> {
        const imageId = await this.instance.post(
            'images',
            {
                project: this.projectId,
                name: imageName,
                root_volume: snapshotId,
                arch: arch,
            }
        )
            .then((r) => r.data.image);

        return imageId;
    }

    public async getImage(imageId: string): Promise<IScalewayImage> {
        const response = await this.instance.get(`images/${imageId}`)
            .then((r) => r.data.image);

        return response;
    }

    public async deleteImage(imageId: string): Promise<void> {
        await this.instance.delete(`images/${imageId}`);
    }
}
