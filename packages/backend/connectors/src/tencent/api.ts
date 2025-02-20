import {
    ONE_SECOND_IN_MS,
    TENCENT_DEFAULT_REGION,
} from '@scrapoxy/common';
import axios, { AxiosError } from 'axios';
import { TencentCloudSignerV4 } from './signature';
import { buildFilters } from './tencent.helpers';
import type {
    ITencentDescribeImagesRequest,
    ITencentDescribeImagesResponse,
    ITencentDescribeInstancesRequest,
    ITencentDescribeInstancesResponse,
    ITencentDescribeInstanceTypeConfigsResponse,
    ITencentDescribeRegionsResponse,
    ITencentDescribeZonesResponse,
    ITencentImage,
    ITencentInstance,
    ITencentRunInstancesRequest,
    ITencentRunInstancesResponse,
} from './tencent.interface';
import type { Agents } from '@scrapoxy/backend-sdk';
import type {
    AxiosInstance,
    AxiosResponse,
} from 'axios';


export class TencentError extends Error {
}


export class TencentApi {
    private readonly instance: AxiosInstance;

    constructor(
        secretId: string,
        secretKey: string,
        region: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            timeout: 20 * ONE_SECOND_IN_MS,
            baseURL: 'https://cvm.tencentcloudapi.com',
            headers: {
                'X-TC-Version': '2017-03-12',
                'Content-Type': 'application/json; charset=utf-8',
            },

        });

        const signature = new TencentCloudSignerV4(
            region,
            secretId,
            secretKey,
            'cvm'
        );

        this.instance.interceptors.request.use((config) => {
            config.headers = config.headers || {};

            signature.sign(config);

            return config;
        });

        this.instance.interceptors.response.use(
            (response) => {
                const error = response?.data.Response.Error;

                if (error?.Message) {
                    throw new TencentError(error.Message);
                }

                return response;
            },
            (err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;
                    const error = response?.data;

                    if (error) {
                        throw new TencentError(error.Message);
                    }
                }

                throw err;
            }
        );
    }

    public async describeRegions(): Promise<string[]> {
        const data = await this.tencentPost<ITencentDescribeRegionsResponse>(
            'DescribeRegions',
            {},
            TENCENT_DEFAULT_REGION
        );

        return data.RegionSet.map((r) => r.Region);
    }

    public async describeZones(region: string): Promise<string[]> {
        const data = await this.tencentPost<ITencentDescribeZonesResponse>(
            'DescribeZones',
            {},
            region
        );

        return data.ZoneSet.map((z) => z.Zone);
    }

    public async describeInstances(request?: ITencentDescribeInstancesRequest): Promise<ITencentInstance[]> {
        const body: Record<string, any> = {};
        const keyConverter: Record<string, string> = {
            instancesIds: 'instance-id',
            zones: 'zone',
            group: 'tag:Group',
        };

        if (request) {
            body.Filters = buildFilters(
                request,
                keyConverter
            );
        }

        const data = await this.tencentPost<ITencentDescribeInstancesResponse>(
            'DescribeInstances',
            body
        );

        return data.InstanceSet;
    }

    public async runInstances(request: ITencentRunInstancesRequest): Promise<string[]> {
        const body: any = {
            ImageId: request.imageId,
            InstanceType: request.instanceType,
            InstanceCount: request.count,
            InstanceChargeType: 'POSTPAID_BY_HOUR',
            InstanceName: request.instanceName,
            UserData: Buffer.from(request.userData)
                .toString('base64'),
            Placement: {
                Zone: request.zone,
            },
            InternetAccessible: {
                PublicIpAssigned: true,
                InternetChargeType: 'TRAFFIC_POSTPAID_BY_HOUR',
                InternetMaxBandwidthOut: 100, // 100 Mbps (min of all regions which is Singapore)
            },
            SystemDisk: {
                DiskSize: 20, // Default is 50 GB
            },
        };

        if (request.projectId) {
            body.Placement.ProjectId = request.projectId;
        }

        if (request.group) {
            body.TagSpecification = [
                {
                    ResourceType: 'instance',
                    Tags: [
                        {
                            Key: 'Group',
                            Value: request.group,
                        },
                    ],
                },
            ];
        }

        const data = await this.tencentPost<ITencentRunInstancesResponse>(
            'RunInstances',
            body
        );

        return data.InstanceIdSet;
    }

    public async startInstances(instancesIds: string[]): Promise<void> {
        const body = {
            InstanceIds: instancesIds,
        };
        await this.tencentPost(
            'StartInstances',
            body
        );
    }

    public async terminateInstances(instancesIds: string[]): Promise<void> {
        const body = {
            InstanceIds: instancesIds,
        };
        await this.tencentPost(
            'TerminateInstances',
            body
        );
    }

    public async listInstanceTypes(
        allowedInstanceTypes: string[],
        zone: string
    ): Promise<string[]> {
        const body = {
            Filters: [
                {
                    Name: 'zone',
                    Values: [
                        zone,
                    ],
                },
            ],
        };
        const data = await this.tencentPost<ITencentDescribeInstanceTypeConfigsResponse>(
            'DescribeInstanceTypeConfigs',
            body
        );
        const allInstanceTypes = data.InstanceTypeConfigSet || [];
        const filtered = allInstanceTypes.filter((inst) =>
            allowedInstanceTypes.includes(inst.InstanceType));

        return filtered.map((i) => i.InstanceType);
    }

    public async describeImages(request?: ITencentDescribeImagesRequest): Promise<ITencentImage[]> {
        const body: Record<string, any> = {};
        const keyConverter: Record<string, string> = {
            platform: 'platform',
            imageType: 'image-type',
            imageId: 'image-id',
            name: 'image-name',
        };

        if (request) {
            if (request.instanceType) {
                body.InstanceType = request.instanceType;
            }
            body.Filters = buildFilters(
                request,
                keyConverter
            );
        }

        const data = await this.tencentPost<ITencentDescribeImagesResponse>(
            'DescribeImages',
            body
        );

        return data.ImageSet;
    }

    private async tencentPost<T>(
        action: string,
        data: Record<string, any> = {},
        region?: string
    ): Promise<T> {
        const config = {
            headers: {
                'X-TC-Action': action,
                ...region ? {
                    'X-TC-Region': region,
                } : {},
            },
        };
        const response = await this.instance.post(
            '/',
            data,
            config
        );

        return response.data.Response as T;
    }
}
