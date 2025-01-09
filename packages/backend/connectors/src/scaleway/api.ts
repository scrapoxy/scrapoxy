// import { Agents } from '@scrapoxy/backend-sdk';
import { Agents } from '@scrapoxy/backend-sdk';
import axios, { AxiosError } from 'axios';
import type {
    IScalewayCreateInstancesRequest,
    IScalewayError,
    IScalewayImage,
    IScalewayInstance,
    IScalewaySnapshot, 
} from './scaleway.interface';
import type {
    AxiosInstance,
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

    private readonly projectId: string;

    constructor(
        secretAccessKey: string,
        region: string,
        projectId: string,
        agents: Agents
    ) {
        this.projectId = projectId;
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `https://api.scaleway.com/instance/v1/zones/${region}`,
            headers: {
                'X-Auth-Token': secretAccessKey,
                'Content-Type': 'application/json',
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

    //////////// INSTANCES ////////////
    public async getInstance(instanceId: string): Promise<IScalewayInstance> {
        const instance = await this.instance.get<{ server: IScalewayInstance }>(`/servers/${instanceId}`)
            .then((r) => r.data.server);

        return instance;
    }

    public async listInstances(tags?: string): Promise<IScalewayInstance[]> { // TODO
        const params = new URLSearchParams();

        if (tags) {
            params.set(
                'tags',
                tags
            );
        }

        const instances = await this.instance.get(`/servers/?${params.toString()}`)
            .then((r) => r.data.servers);

        return instances;
    }

    public async createInstance(request: IScalewayCreateInstancesRequest): Promise<IScalewayInstance> {
        request.volumes = {
            0: {
                size: 10000000000,
                volume_type: 'b_ssd', 
            },
        };

        if (!request.tags[ 0 ])
            request.tags = [
                'scrpx', 
            ];

        const instance = await this.instance.post<{ server: IScalewayInstance }>(
            '/servers',
            request
        )
            .then((r) => r.data.server);

        return instance;
    }

    public async deleteInstance(instanceId: string): Promise<void> {
        await this.instance.delete(`/servers/${instanceId}`);
    }

    public async startInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `/servers/${instanceId}/action`,
            {
                action: 'poweron',
            }
        );
    }

    public async stopInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `/servers/${instanceId}/action`,
            {
                action: 'poweroff',
            }
        );
    }

    public async terminateInstance(instanceId: string): Promise<void> {
        await this.instance.post(
            `/servers/${instanceId}/action`,
            {
                action: 'terminate',
            }
        );
    }

    public async listInstanceTypes(types?: string[]): Promise<string[]> {
        return await this.instance.get('/products/servers')
            .then((r) => Object.keys(r.data.servers)
                .filter((key: string) => types ? types.includes(key) : true));
    }

    public async setUserData(
        instanceId: string, userData: string
    ) {
        this.instance.defaults.headers[ 'Content-Type' ] = 'text/plain';
        try {
            await this.instance.patch(
                `/servers/${instanceId}/user_data/cloud-init`,
                userData
            );
        } catch (error) {}
        this.instance.defaults.headers[ 'Content-Type' ] = 'application/json';
    }

    //////////// IPS ////////////
    public async attachIP(instanceId: string): Promise<void> {
        await this.instance.post(
            '/ips',
            {
                server: instanceId,
                type: 'routed_ipv4',
                project: this.projectId,
            }
        );
    }

    public async deleteIP(ipId: string): Promise<void> {
        await this.instance.delete(`/ips/${ipId}`);
    }

    //////////// VOLUMES ////////////
    public async deleteVolume(volumeId: string): Promise<void> {
        await this.instance.delete(`/volumes/${volumeId}`);
    }

    public async getVolumeSize(type: string): Promise<number> {
        return await this.instance.get('/products/servers')
            .then((res: {
                data: {
                    servers: Record<string, {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        display_name: string;
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        per_volumes_constraint: {
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            min_size: number;
                        };
                    }>;
                };
            }) => {
            
                const volume = res.data.servers[ type ];

                if (!volume) throw new Error('Volume type invalid');
                console.log(volume);
        
                return volume.per_volumes_constraint.min_size;  
            });
    }

    //////////// SNAPSHOTS ////////////
    public async createSnapshot(
        volumeId: string, snapshotName: string
    ): Promise<IScalewaySnapshot> {
        const snapshot = await this.instance.post(
            '/snapshots',
            {
                project: this.projectId,
                volume_id: volumeId,
                name: snapshotName,
            }
        )
            .then((r) => r.data.snapshot);

        return snapshot;
    }

    public async listSnapshots(): Promise<IScalewaySnapshot[]> {
        const response = await this.instance.get('/snapshots')
            .then((r) => r.data);

        return response;
    }

    public async getSnapshot(snapshotId: string): Promise<IScalewaySnapshot> {
        const response = await this.instance.get(`/snapshots/${snapshotId}`)
            .then((r) => r.data.snapshot);

        return response;
    }

    public async deleteSnapshot(snapshotId: string): Promise<void> {
        await this.instance.delete(`/snapshots/${snapshotId}`);
    }

    //////////// IMAGES ////////////
    public async createImage(
        imageName: string, snapshotId: string, arch: string
    ): Promise<IScalewayImage> {
        const imageId = await this.instance.post(
            '/images',
            {
                name: imageName,
                root_volume: snapshotId,
                arch: arch,
                project: this.projectId,
            }
        )
            .then((r) => r.data.image);

        return imageId;
    }

    public async getImage(imageId: string): Promise<IScalewayImage> {
        const response = await this.instance.get(`/images/${imageId}`)
            .then((r) => r.data.image);

        return response;
    }

    public async deleteImage(imageId: string): Promise<void> {
        await this.instance.delete(`/images/${imageId}`);
    }

    
}