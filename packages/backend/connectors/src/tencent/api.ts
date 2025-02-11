import {
    ONE_SECOND_IN_MS,
    TENCENT_DEFAULT_REGION, 
} from '@scrapoxy/common';
import axios, { AxiosError } from 'axios';
import { TencentCloudSignerV4 } from './signature';
import type {
    ITencentDescribeImagesRequest,
    ITencentDescribeInstancesRequest,
    ITencentError,
    ITencentImage,
    ITencentInstance,
    ITencentRunInstancesRequest,
} from './tencent.interface';
import type { Agents } from '@scrapoxy/backend-sdk';
import type {
    AxiosInstance,
    AxiosResponse, 
} from 'axios';


export class TencentError extends Error {
    constructor(
        public errorClass: string,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Message: string
    ) {
        super(Message);
    }
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
              const error = response?.data.Response.Error as ITencentError;

              if (error?.Message) {
                  throw new TencentError(
                      error.class || 'UnknownError',
                      error.Message
                  );
              }

              return response;
          },
          (err: any) => {
              if (err instanceof AxiosError) {
                  const errAxios = err as AxiosError;
                  const response = errAxios.response as AxiosResponse;
                  const error = response?.data as ITencentError;

                  if (error) {
                      throw new TencentError(
                          error.class || 'UnknownError',
                          error.Message
                      );
                  }
              }

              throw err;
          }
      );
  }

  public async describeRegions(): Promise<string[]> {
      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          RegionSet: { Region: string }[];
      }>(
          'DescribeRegions',
          {},
          TENCENT_DEFAULT_REGION
      );

      return data.RegionSet.map((r) => r.Region);
  }

  public async describeZones(region: string): Promise<string[]> {
      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          ZoneSet: { Zone: string }[];
      }>(
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
          body.Filters = this.buildFilters(
              request,
              keyConverter
          );
      }

      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          InstanceSet: ITencentInstance[];
      }>(
          'DescribeInstances',
          body
      );

      return data.InstanceSet;
  }

  public async runInstances(request: ITencentRunInstancesRequest): Promise<string[]> {
      const body = {
          ImageId: request.imageId,
          InstanceType: request.instanceType,
          InstanceCount: request.count,
          InstanceChargeType: 'POSTPAID_BY_HOUR',
          InstanceName: request.instanceName || 'Default-Instance',
          UserData: request.userData
              ? Buffer.from(request.userData)
                  .toString('base64')
              : undefined,
          Placement: {
              Zone: request.zone,
              ProjectId: request.projectId ? Number(request.projectId) : undefined,
          },
          InternetAccessible: {
              PublicIpAssigned: true,
              InternetChargeType: 'TRAFFIC_POSTPAID_BY_HOUR',
              InternetMaxBandwidthOut: 5,
          },
          TagSpecification: request.group
              ? [
                  {
                      ResourceType: 'instance',
                      Tags: [
                          {
                              Key: 'Group',
                              Value: request.group,
                          },
                      ],
                  },
              ]
              : undefined,
      };
      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          InstanceIdSet: string[];
      }>(
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

  public async stopInstances(instancesIds: string[]): Promise<void> {
      const body = {
          InstanceIds: instancesIds,
      };
      await this.tencentPost(
          'StopInstances',
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
      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          InstanceTypeConfigSet: { InstanceType: string }[];
      }>(
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
          body.Filters = this.buildFilters(
              request,
              keyConverter
          );
      }

      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          ImageSet: ITencentImage[];
      }>(
          'DescribeImages',
          body
      );

      return data.ImageSet;
  }

  public async describeImage(imageId: string): Promise<ITencentImage> {
      const body = {
          ImageIds: [
              imageId, 
          ],
      };
      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          ImageSet: ITencentImage[];
      }>(
          'DescribeImages',
          body
      );

      return data.ImageSet[ 0 ];
  }

  public async createImage(
      imageName: string,
      instancesId: string
  ): Promise<string> {
      const body = {
          ImageName: imageName,
          InstanceId: instancesId,
      };
      const data = await this.tencentPost<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
          ImageId: string;
      }>(
          'CreateImage',
          body
      );

      return data.ImageId;
  }

  public async deleteImages(imagesIds: string[]): Promise<void> {
      const body = {
          ImageIds: imagesIds,
          DeleteBindedSnap: true,
      };

      await this.tencentPost(
          'DeleteImages',
          body
      );
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

  private buildFilters(
      request: Record<string, any>,
      keyConverter: Record<string, string>
      // eslint-disable-next-line @typescript-eslint/naming-convention
  ): { Name: string; Values: string[] }[] {
      return Object.entries(request)
          .flatMap(([
              key, value, 
          ]) => {
              if (!keyConverter[ key ] || !value) {
                  return [];
              }

              if (Array.isArray(value)) {
                  return {
                      Name: keyConverter[ key ],
                      Values: value,
                  };
              }

              return {
                  Name: keyConverter[ key ],
                  Values: [
                      value, 
                  ],
              };
          });
  }
}