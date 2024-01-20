import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    EProxyStatus,
    randomName,
    safeJoin,
} from '@scrapoxy/common';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/connector-ovh-sdk';
import { OvhApi } from './api';
import { getOvhExternalIp } from './ovh.helpers';
import { EOvhInstanceStatus } from './ovh.interface';
import type {
    IConnectorOvhConfig,
    IConnectorOvhCredential,
    IOvhInstance,
} from './ovh.interface';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigDatacenter,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertStatus(status: EOvhInstanceStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EOvhInstanceStatus.ACTIVE:
            return EProxyStatus.STARTED;

        case EOvhInstanceStatus.BUILD:
        case EOvhInstanceStatus.REBOOT:
        case EOvhInstanceStatus.HARD_REBOOT:
            return EProxyStatus.STARTING;

        case EOvhInstanceStatus.STOPPED:
        case EOvhInstanceStatus.SHUTOFF:
            return EProxyStatus.STOPPED;

        case EOvhInstanceStatus.DELETING:
            return EProxyStatus.STOPPING;

        default:
            return EProxyStatus.ERROR;
    }
}


function convertToProxy(
    instance: IOvhInstance, port: number
): IConnectorProxyRefreshed {
    const hostname = getOvhExternalIp(instance);
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: hostname ? {
            hostname,
            port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_OVH_TYPE,
        key: instance.id,
        name: instance.name,
        config,
        status: convertStatus(instance.status),
    };

    return proxy;
}


export class ConnectorOvhService implements IConnectorService {
    private readonly logger = new Logger(ConnectorOvhService.name);

    private readonly api: OvhApi;

    constructor(
        credentialConfig: IConnectorOvhCredential,
        private readonly connectorConfig: IConnectorOvhConfig,
        agents: Agents
    ) {
        this.api = new OvhApi(
            credentialConfig.appKey,
            credentialConfig.appSecret,
            credentialConfig.consumerKey,
            agents
        );
    }

    async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const instances = await this.api.getAllInstances(
            this.connectorConfig.projectId,
            this.connectorConfig.region
        );

        return instances
            .filter((i) => i.name.startsWith(`${this.connectorConfig.tag}-`))
            .map((i) => convertToProxy(
                i,
                this.connectorConfig.port
            ));
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const instances = await this.api.createInstances({
            projectId: this.connectorConfig.projectId,
            region: this.connectorConfig.region,
            name: `${this.connectorConfig.tag}-${randomName()}`,
            flavorId: this.connectorConfig.flavorId,
            imageId: this.connectorConfig.snapshotId,
            count,
        });

        return instances.map((i) => convertToProxy(
            i,
            this.connectorConfig.port
        ));
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        await Promise.all(keys.map((key) => this.api.startInstance(
            this.connectorConfig.projectId,
            key
        )));
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

        await Promise.all(proxiesKeys.map((key) => this.api.removeInstance(
            this.connectorConfig.projectId,
            key
        )));

        return [];
    }
}
