import { Agents } from '@scrapoxy/backend-sdk';
import axios, { AxiosError } from 'axios';
import * as jwt from 'jsonwebtoken';
import type {
    IGcpBulkInsertInstancesRequest,
    IGcpFirewall,
    IGcpImage,
    IGcpInsertFirewallRequest,
    IGcpInsertImageRequest,
    IGcpInsertInstanceRequest,
    IGcpInsertTemplateRequest,
    IGcpInstance,
    IGcpInstanceTemplate,
    IGcpItems,
    IGcpMachineType,
    IGcpNetwork,
    IGcpOperation,
    IGcpZone,
} from './gcp.interface';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';


export class GcpError extends Error {
    constructor(
        public code: string,
        message: string
    ) {
        super(message);
    }
}


function getStorageLocation(zone: string): string {
    const ind = zone.lastIndexOf('-');

    return zone.substring(
        0,
        ind
    );
}


export class GcpApi {
    private readonly instance: AxiosInstance;

    constructor(
        private readonly projectId: string,
        clientEmail: string,
        privateKeyId: string,
        privateKey: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `https://www.googleapis.com/compute/v1/projects/${this.projectId}`,
            headers: {
                Host: 'compute.googleapis.com',
            },
        });

        this.instance.interceptors.request.use((config) => {
            const token = jwt.sign(
                {},
                privateKey,
                {
                    algorithm: 'RS256',
                    expiresIn: '1h',
                    keyid: privateKeyId,
                    audience: 'https://compute.googleapis.com/',
                    issuer: clientEmail,
                    subject: clientEmail,
                }
            );

            config.headers.Authorization = `Bearer ${token}`;

            return config;
        });

        this.instance.interceptors.response.use(
            (response) => response,
            async(err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;
                    const error = response?.data?.error;

                    if (error) {
                        throw new GcpError(
                            error.code,
                            error.message
                        );
                    }
                }

                throw err;
            }
        );
    }

    //////////// ZONES ////////////
    async listZones(): Promise<IGcpZone[]> {
        const response = await this.instance.get<IGcpItems<IGcpZone>>('zones');

        return response.data.items ?? [];
    }

    //////////// MACHINE TYPES ////////////
    async listMachineTypes(
        zone: string, filterNames?: string[]
    ): Promise<IGcpMachineType[]> {
        const options: AxiosRequestConfig = {};

        if (filterNames && filterNames.length > 0) {
            options.params = {
                filter: filterNames.map((name) => `name=${name}`)
                    .join(' OR '),
            };
        }

        const response = await this.instance.get<IGcpItems<IGcpMachineType>>(
            `zones/${zone}/machineTypes`,
            options
        );

        return response.data.items ?? [];
    }

    //////////// NETWORKS ////////////
    async getNetwork(networkName: string): Promise<IGcpNetwork> {
        const response = await this.instance.get<IGcpFirewall>(`global/networks/${networkName}`);

        return response.data;
    }

    //////////// FIREWALLS ////////////
    async getFirewall(firewallName: string): Promise<IGcpFirewall> {
        const response = await this.instance.get<IGcpFirewall>(`global/firewalls/${firewallName}`);

        return response.data;
    }

    async insertFirewall(request: IGcpInsertFirewallRequest): Promise<IGcpOperation> {
        const payload = {
            allowed: request.allowed,
            direction: 'INGRESS',
            name: request.firewallName,
            network: `global/networks/${request.networkName}`,
            priority: request.priority,
        };
        const response = await this.instance.post<IGcpOperation>(
            'global/firewalls',
            payload
        );

        return response.data;
    }

    async deleteFirewall(firewallName: string): Promise<IGcpOperation> {
        const response = await this.instance.delete<IGcpOperation>(`global/firewalls/${firewallName}`);

        return response.data;
    }

    //////////// INSTANCES ////////////
    async listInstances(
        zone: string,
        labelName?: string
    ): Promise<IGcpInstance[]> {
        const options: AxiosRequestConfig = {};

        if (labelName && labelName.length > 0) {
            options.params = {
                filter: `labels.name=${labelName}`,
            };
        }

        const response = await this.instance.get<IGcpItems<IGcpInstance>>(
            `zones/${zone}/instances`,
            options
        );

        return response.data.items ?? [];
    }

    async getInstance(
        zone: string, instanceName: string
    ): Promise<IGcpInstance> {
        const response = await this.instance.get<IGcpInstance>(`zones/${zone}/instances/${instanceName}`);

        return response.data;
    }

    async insertInstance(request: IGcpInsertInstanceRequest): Promise<IGcpOperation> {
        const payload = {
            disks: [
                {
                    autoDelete: true,
                    boot: true,
                    initializeParams: {
                        labels: {},
                        resourceManagerTags: {},
                        diskName: request.diskName,
                        diskSizeGb: request.diskSizeGb,
                        diskType: `projects/${this.projectId}/zones/${request.zone}/diskTypes/${request.diskType}`,
                        sourceImage: request.sourceImage,
                    },
                    mode: 'READ_WRITE',
                    type: 'PERSISTENT',
                },
            ],
            labels: {},
            networkInterfaces: [
                {
                    accessConfigs: [
                        {
                            kind: 'compute#accessConfig',
                            name: 'External NAT',
                            networkTier: 'PREMIUM',
                            type: 'ONE_TO_ONE_NAT',
                        },
                    ],
                    name: `global/networks/${request.networkName}`,
                },
            ],
            canIpForward: false,
            confidentialInstanceConfig: {
                enableConfidentialCompute: false,
            },
            deletionProtection: false,
            displayDevice: {
                enableDisplay: true,
            },
            machineType: `projects/${this.projectId}/zones/${request.zone}/machineTypes/${request.machineType}`,
            metadata: {
                items: [
                    {
                        key: 'startup-script',
                        value: request.startupScript,
                    },
                    {
                        key: 'block-project-ssh-keys',
                        value: 'true',
                    },
                ],
            },
            name: request.instanceName,
            reservationAffinity: {
                consumeReservationType: 'ANY_RESERVATION',
            },
            scheduling: {
                automaticRestart: true,
                onHostMaintenance: 'TERMINATE',
                preemptible: false,
            },
            shieldedInstanceConfig: {
                enableIntegrityMonitoring: false,
                enableSecureBoot: false,
                enableVtpm: false,
            },
        };
        const response = await this.instance.post<IGcpOperation>(
            `zones/${request.zone}/instances`,
            payload
        );

        return response.data;
    }

    async bulkInsertInstances(request: IGcpBulkInsertInstancesRequest): Promise<IGcpOperation> {
        const payload = {
            perInstanceProperties: {} as any,
            count: request.instancesNames.length,
            instanceProperties: {
                labels: {
                    name: request.labelName,
                },
                resourceManagerTags: {},
                machineType: request.machineType,
                metadata: {
                    items: [
                        {
                            key: 'startup-script',
                            value: request.startupScript,
                        },
                        {
                            key: 'block-project-ssh-keys',
                            value: 'true',
                        },
                    ],
                },
            },
            sourceInstanceTemplate: `projects/${this.projectId}/global/instanceTemplates/${request.templateName}`,
        };

        for (const instanceName of request.instancesNames) {
            payload.perInstanceProperties[ instanceName ] = {
                name: instanceName,
            };
        }

        const response = await this.instance.post<IGcpOperation>(
            `zones/${request.zone}/instances/bulkInsert`,
            payload
        );

        return response.data;
    }

    async startInstance(
        zone: string, instanceName: string
    ): Promise<IGcpOperation> {
        const response = await this.instance.post<IGcpOperation>(
            `zones/${zone}/instances/${instanceName}/start`,
            {}
        );

        return response.data;
    }

    async stopInstance(
        zone: string, instanceName: string
    ): Promise<IGcpOperation> {
        const response = await this.instance.post<IGcpOperation>(
            `zones/${zone}/instances/${instanceName}/stop`,
            {}
        );

        return response.data;
    }

    async deleteInstance(
        zone: string, instanceName: string
    ): Promise<IGcpOperation> {
        const response = await this.instance.delete<IGcpOperation>(`zones/${zone}/instances/${instanceName}`);

        return response.data;
    }

    //////////// IMAGES ////////////
    async getImage(imageName: string): Promise<IGcpImage> {
        const response = await this.instance.get<IGcpImage>(`global/images/${imageName}`);

        return response.data;
    }

    async insertImage(request: IGcpInsertImageRequest): Promise<IGcpOperation> {
        const payload = {
            labels: {},
            storageLocations: [
                getStorageLocation(request.zone),
            ],
            name: request.imageName,
            sourceDisk: `projects/${this.projectId}/zones/${request.zone}/disks/${request.diskName}`,
        };
        const response = await this.instance.post<IGcpOperation>(
            'global/images',
            payload
        );

        return response.data;
    }

    async deleteImage(imageName: string): Promise<IGcpOperation> {
        const response = await this.instance.delete<IGcpOperation>(`global/images/${imageName}`);

        return response.data;
    }

    //////////// INSTANCE TEMPLATES ////////////
    async getTemplate(templateName: string): Promise<IGcpInstanceTemplate> {
        const response = await this.instance.get<IGcpInstance>(`global/instanceTemplates/${templateName}`);

        return response.data;
    }

    async insertTemplate(request: IGcpInsertTemplateRequest): Promise<IGcpOperation> {
        const payload = {
            name: request.templateName,
            properties: {
                disks: [
                    {
                        autoDelete: true,
                        boot: true,
                        initializeParams: {
                            labels: {},
                            resourceManagerTags: {},
                            diskSizeGb: request.diskSizeGb,
                            diskType: request.diskType,
                            sourceImage: `projects/${this.projectId}/global/images/${request.sourceImage}`,
                        },
                        mode: 'READ_WRITE',
                        type: 'PERSISTENT',
                    },
                ],
                labels: {},
                networkInterfaces: [
                    {
                        accessConfigs: [
                            {
                                kind: 'compute#accessConfig',
                                name: 'External NAT',
                                networkTier: 'PREMIUM',
                                type: 'ONE_TO_ONE_NAT',
                            },
                        ],
                        network: `global/networks/${request.networkName}`,
                    },
                ],
                resourceManagerTags: {},
                canIpForward: false,
                confidentialInstanceConfig: {
                    enableConfidentialCompute: false,
                },
                machineType: request.machineType,
                metadata: {
                    items: [
                        {
                            key: 'block-project-ssh-keys',
                            value: 'true',
                        },
                    ],
                },
                reservationAffinity: {
                    consumeReservationType: 'ANY_RESERVATION',
                },
                scheduling: {
                    automaticRestart: true,
                    onHostMaintenance: 'TERMINATE',
                    preemptible: false,
                },
                shieldedInstanceConfig: {
                    enableIntegrityMonitoring: false,
                    enableSecureBoot: false,
                    enableVtpm: false,
                },
            },
        };
        const response = await this.instance.post<IGcpOperation>(
            'global/instanceTemplates',
            payload
        );

        return response.data;
    }

    async deleteTemplate(templateName: string): Promise<IGcpOperation> {
        const response = await this.instance.delete<IGcpOperation>(`global/instanceTemplates/${templateName}`);

        return response.data;
    }

    //////////// OPERATIONS ////////////
    async getGlobalOperation(operationId: string): Promise<IGcpOperation> {
        const response = await this.instance.get<IGcpOperation>(`global/operations/${operationId}`);

        return response.data;
    }

    async getOperation(
        zone: string, operationId: string
    ): Promise<IGcpOperation> {
        const response = await this.instance.get<IGcpOperation>(`zones/${zone}/operations/${operationId}`);

        return response.data;
    }
}
