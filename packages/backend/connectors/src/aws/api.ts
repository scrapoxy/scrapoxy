import {
    Agents,
    AxiosFormData,
} from '@scrapoxy/backend-sdk';
import axios, { AxiosError } from 'axios';
import { parseStringPromise } from 'xml2js';
import { AwsSignatureV4 } from './signature';
import type {
    IAwsAuthorizeSecurityGroupIngressPermission,
    IAwsCreateSecurityGroupResponse,
    IAwsDescribeImagesRequest,
    IAwsDescribeImagesResponse,
    IAwsDescribeInstancesRequest,
    IAwsDescribeInstancesResponse,
    IAwsDescribeInstancesTypesResponse,
    IAwsDescribeRegionsResponse,
    IAwsDescribeRunInstancesRequest,
    IAwsDescribeRunInstancesResponse,
    IAwsError,
    IAwsImage,
    IAwsInstance,
    IAwsInstanceType,
} from './aws.interface';
import type {
    AxiosInstance,
    AxiosResponse,
} from 'axios';


export class AwsError extends Error {
    constructor(
        public code: string,
        message: string
    ) {
        super(message);
    }
}


export class AwsApi {
    private readonly instance: AxiosInstance;

    constructor(
        accessKeyId: string,
        secretAccessKey: string,
        region: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `https://ec2.${region}.amazonaws.com`,
            headers: {
                Host: `ec2.${region}.amazonaws.com`,
            },
        });

        const signature = new AwsSignatureV4(
            region,
            accessKeyId,
            secretAccessKey
        );

        this.instance.interceptors.request.use((config) => {
            config.headers = config.headers || {};

            if (config.data instanceof AxiosFormData) {
                const formdata = config.data as AxiosFormData;

                if (!formdata.has('Version')) {
                    formdata.append(
                        'Version',
                        '2016-11-15'
                    );
                }

                config.data = formdata.toString();
                config.headers[ 'Content-Type' ] = 'application/x-www-form-urlencoded';
            }

            signature.sign(config);

            return config;
        });

        this.instance.interceptors.response.use(
            async(response) => {
                const contentType = response.headers[ 'content-type' ] ?? '';

                if (contentType.includes('xml')) {
                    response.data = await parseStringPromise(
                        response.data,
                        {
                            emptyTag: () => void 0,
                        }
                    );
                }

                return response;
            },
            async(err: any) => {
                if (err instanceof AxiosError) {
                    const errAxios = err as AxiosError;
                    const response = errAxios.response as AxiosResponse;

                    if (response) {
                        const contentType = response.headers[ 'content-type' ] ?? '';

                        if (contentType.includes('xml') && response.data) {
                            const data = await parseStringPromise(
                                response.data,
                                {
                                    emptyTag: () => void 0,
                                }
                            );
                            const errors = data.Response.Errors as IAwsError[];

                            if (errors.length > 0) {
                                const error = errors[ 0 ].Error[ 0 ];

                                throw new AwsError(
                                    error.Code[ 0 ],
                                    error.Message[ 0 ]
                                );
                            }
                        }
                    }
                }

                throw err;
            }
        );
    }

    //////////// REGIONS ////////////
    public async describeRegions(regionsFilters?: string[]): Promise<string[]> {
        const data = new AxiosFormData({
            Action: 'DescribeRegions',
            'Filter.1.Name': 'opt-in-status',
            'Filter.1.Value.1': 'opt-in-not-required',
            'Filter.1.Value.2': 'opted-in',
            AllRegions: 'true',
        });

        if (regionsFilters && regionsFilters.length > 0) {
            data.append(
                'Filter.2.Name',
                'region-name'
            );

            for (let i = 0; i < regionsFilters.length; i++) {
                data.append(
                    `Filter.2.Value.${i + 1}`,
                    regionsFilters[ i ]
                );
            }
        }

        const response = await this.instance.post(
            '/',
            data
        )
            .then((r) => r.data.DescribeRegionsResponse as IAwsDescribeRegionsResponse);
        const regions: string[] = [];
        for (const regionInfo of response.regionInfo) {
            if (regionInfo) {
                for (const regionInfoItem of regionInfo.item) {
                    regions.push(regionInfoItem.regionName[ 0 ]);
                }
            }
        }

        return regions;
    }

    //////////// INSTANCES TYPES ////////////
    public async describeInstancesTypes(instancesFilter?: string[]): Promise<IAwsInstanceType[]> {
        const data = new AxiosFormData({
            Action: 'DescribeInstanceTypes',
        });

        if (instancesFilter && instancesFilter.length > 0) {
            for (let i = 0; i < instancesFilter.length; i++) {
                data.append(
                    `InstanceType.${i + 1}`,
                    instancesFilter[ i ]
                );
            }
        }

        const response = await this.instance.post(
            '/',
            data
        )
            .then((r) => r.data.DescribeInstanceTypesResponse as IAwsDescribeInstancesTypesResponse);
        const types: IAwsInstanceType[] = [];
        for (const instanceTypeSet of response.instanceTypeSet) {
            if (instanceTypeSet) {
                types.push(...instanceTypeSet.item);
            }
        }

        return types;
    }

    //////////// SECURITY GROUP ////////////
    public async createSecurityGroup(name: string): Promise<string> {
        const data = new AxiosFormData({
            Action: 'CreateSecurityGroup',
            GroupName: name,
            GroupDescription: name,
        });
        const response = await this.instance.post(
            '/',
            data
        )
            .then((r) => r.data.CreateSecurityGroupResponse as IAwsCreateSecurityGroupResponse);
        const groupId = response.groupId;

        return groupId;
    }

    public async authorizeSecurityGroupIngress(
        groupName: string,
        permissions: IAwsAuthorizeSecurityGroupIngressPermission[]
    ): Promise<void> {
        const data = new AxiosFormData({
            Action: 'AuthorizeSecurityGroupIngress',
            GroupName: groupName,
        });

        for (let i = 0; i < permissions.length; i++) {
            const prefix = `IpPermissions.${i + 1}`;
            data.appendObject({
                [ `${prefix}.FromPort` ]: permissions[ i ].fromPort,
                [ `${prefix}.IpProtocol` ]: permissions[ i ].protocol,
                [ `${prefix}.IpRanges.1.CidrIp` ]: permissions[ i ].cidrIp,
                [ `${prefix}.ToPort` ]: permissions[ i ].toPort,
            });
        }

        await this.instance.post(
            '/',
            data
        );
    }

    //////////// INSTANCES ////////////
    public async describeInstances(request?: IAwsDescribeInstancesRequest): Promise<IAwsInstance[]> {
        const data = new AxiosFormData({
            Action: 'DescribeInstances',
        });

        if (request) {
            if (request.instancesIds && request.instancesIds.length > 0) {
                for (let i = 0; i < request.instancesIds.length; i++) {
                    data.append(
                        `InstanceId.${i + 1}`,
                        request.instancesIds[ i ]
                    );
                }
            }

            let filterIndex = 1;

            if (request.statesCodes && request.statesCodes.length > 0) {
                data.append(
                    `Filter.${filterIndex}.Name`,
                    'instance-state-code'
                );
                for (let i = 0; i < request.statesCodes.length; i++) {
                    data.append(
                        `Filter.${filterIndex}.Value.${i + 1}`,
                        request.statesCodes[ i ]
                    );
                }

                ++filterIndex;
            }

            if (request.group && request.group.length > 0) {
                data.appendObject({
                    [ `Filter.${filterIndex}.Name` ]: 'tag:Group',
                    [ `Filter.${filterIndex}.Value.1` ]: request.group,
                });

                ++filterIndex;
            }
        }

        const response = await this.instance.post(
            '/',
            data
        )
            .then((r) => r.data.DescribeInstancesResponse as IAwsDescribeInstancesResponse);
        const instances: IAwsInstance[] = [];

        for (const reservationSet of response.reservationSet) {
            if (reservationSet) {
                for (const reservationSetItem of reservationSet.item) {
                    for (const instanceSet of reservationSetItem.instancesSet) {
                        if (instanceSet) {
                            instances.push(...instanceSet.item);
                        }
                    }
                }
            }
        }

        return instances;
    }

    public async runInstances(request: IAwsDescribeRunInstancesRequest): Promise<IAwsInstance[]> {
        const data = new AxiosFormData({
            Action: 'RunInstances',
            ImageId: request.imageId,
            InstanceType: request.instanceType,
            MaxCount: request.count,
            MinCount: 1,
            'Monitoring.Enabled': 'false',
            'SecurityGroup.1': request.securityGroup,
            InstanceInitiatedShutdownBehavior: request.terminateOnShutdown ? 'terminate' : 'stop',
        });

        if (request.group && request.group.length > 0) {
            data.appendObject({
                'TagSpecification.1.ResourceType': 'instance',
                'TagSpecification.1.Tag.2.Key': 'Group',
                'TagSpecification.1.Tag.2.Value': request.group,
            });
        }

        if (request.userData && request.userData.length > 0) {
            data.append(
                'UserData',
                Buffer.from(request.userData)
                    .toString('base64')
            );
        }

        const response = await this.instance.post(
            '/',
            data
        )
            .then((r) => r.data.RunInstancesResponse as IAwsDescribeRunInstancesResponse);
        const instances: IAwsInstance[] = [];
        for (const instancesSet of response.instancesSet) {
            if (instancesSet?.item) {
                instances.push(...instancesSet.item);
            }
        }

        return instances;
    }

    public async startInstances(instancesIds: string[]): Promise<void> {
        const data = new AxiosFormData({
            Action: 'StartInstances',
        });

        for (let i = 0; i < instancesIds.length; i++) {
            data.append(
                `InstanceId.${i + 1}`,
                instancesIds[ i ]
            );
        }

        await this.instance.post(
            '/',
            data
        );
    }

    public async terminateInstances(instancesIds: string[]): Promise<void> {
        const data = new AxiosFormData({
            Action: 'TerminateInstances',
        });

        for (let i = 0; i < instancesIds.length; i++) {
            data.append(
                `InstanceId.${i + 1}`,
                instancesIds[ i ]
            );
        }

        await this.instance.post(
            '/',
            data
        );
    }

    //////////// IMAGES ////////////
    public async describeImages(request?: IAwsDescribeImagesRequest): Promise<IAwsImage[]> {
        const data = new AxiosFormData({
            Action: 'DescribeImages',
        });
        let i = 1;

        if (request) {
            if (request.architecture && request.architecture.length > 0) {
                data.appendObject({
                    [ `Filter.${i}.Name` ]: 'architecture',
                    [ `Filter.${i}.Value.1` ]: request.architecture,
                });
                i++;
            }

            if (request.imageType && request.imageType.length > 0) {
                data.appendObject({
                    [ `Filter.${i}.Name` ]: 'image-type',
                    [ `Filter.${i}.Value.1` ]: request.imageType,
                });
                i++;
            }

            if (request.isPublic === false || request.isPublic === true) {
                data.appendObject({
                    [ `Filter.${i}.Name` ]: 'is-public',
                    [ `Filter.${i}.Value.1` ]: request.isPublic.toString(),
                });
                i++;
            }

            if (request.name && request.name.length > 0) {
                data.appendObject({
                    [ `Filter.${i}.Name` ]: 'name',
                    [ `Filter.${i}.Value.1` ]: request.name,
                });
                i++;
            }

            if (request.ownerAlias && request.ownerAlias.length > 0) {
                data.appendObject({
                    [ `Filter.${i}.Name` ]: 'owner-alias',
                    [ `Filter.${i}.Value.1` ]: request.ownerAlias,
                });
                i++;
            }

            if (request.state && request.state.length > 0) {
                data.appendObject({
                    [ `Filter.${i}.Name` ]: 'state',
                    [ `Filter.${i}.Value.1` ]: request.state,
                });
                i++;
            }

            if (request.virtualizationType && request.virtualizationType.length > 0) {
                data.appendObject({
                    [ `Filter.${i}.Name` ]: 'virtualization-type',
                    [ `Filter.${i}.Value.1` ]: request.virtualizationType,
                });
                i++;
            }
        }

        const response = await this.instance.post(
            '/',
            data
        )
            .then((r) => r.data.DescribeImagesResponse as IAwsDescribeImagesResponse);
        const images: IAwsImage[] = [];
        for (const imagesSet of response.imagesSet) {
            if (imagesSet) {
                images.push(...imagesSet.item);
            }
        }

        return images;
    }
}
