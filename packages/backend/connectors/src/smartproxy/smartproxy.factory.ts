import * as fs from 'fs';
import { resolve as resolvePath } from 'path';
import { createGunzip } from 'zlib';
import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    getEnvAssetsPath,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_SMARTPROXY_TYPE,
    ESmartproxyCredentialType,
} from '@scrapoxy/common';
import { ConnectorSmartproxyEndpointsService } from './smartproxy-endpoints.service';
import { ConnectorSmartproxyServerService } from './smartproxy-server.service';
import {
    schemaConfig,
    schemaCredential,
} from './smartproxy.validation';
import {
    TRANSPORT_SMARTPROXY_ENDPOINTS_DC_TYPE,
    TRANSPORT_SMARTPROXY_ENDPOINTS_RESIDENTIAL_TYPE,
} from './transport';
import type {
    IConnectorSmartproxyConfig,
    IConnectorSmartproxyCredential,
    ISmartproxyEndpoint,
} from './smartproxy.interface';
import type {
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorListProxies,
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorSmartproxyFactory implements IConnectorFactory, OnModuleInit, OnModuleDestroy {
    readonly type = CONNECTOR_SMARTPROXY_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    private readonly endpointsDC = new Map<string, ISmartproxyEndpoint>();

    private readonly endpointsResidential = new Map<string, ISmartproxyEndpoint>();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async onModuleInit(): Promise<void> {
        const [
            endpointsDC, endpointsResidential,
        ] = await Promise.all([
            this.loadEndpoints(resolvePath(
                getEnvAssetsPath(),
                'connectors',
                'smartproxy',
                'endpoints-dc.json.gz'
            )),
            this.loadEndpoints(resolvePath(
                getEnvAssetsPath(),
                'connectors',
                'smartproxy',
                'endpoints-residential.json.gz'
            )),
        ]);

        this.endpointsDC.clear();
        this.endpointsDC.set(
            'all',
            {
                code: 'all',
                hostname: 'all.dc.smartproxy.com',
                portMin: 10001,
                portMax: 50000,
            }
        );
        for (const endpoint of endpointsDC) {
            this.endpointsDC.set(
                endpoint.code.toLowerCase(),
                endpoint
            );
        }

        this.endpointsResidential.clear();
        this.endpointsResidential.set(
            'all',
            {
                code: 'all',
                hostname: 'gate.smartproxy.com',
                portMin: 10001,
                portMax: 50000,
            }
        );
        for (const endpoint of endpointsResidential) {
            this.endpointsResidential.set(
                endpoint.code.toLowerCase(),
                endpoint
            );
        }
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorSmartproxyCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorSmartproxyCredential,
        connectorConfig: IConnectorSmartproxyConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        const credentialConfig = connector.credentialConfig as IConnectorSmartproxyCredential;

        switch (credentialConfig.credentialType) {
            case ESmartproxyCredentialType.DC_DEDICATED: {
                return new ConnectorSmartproxyServerService(
                    credentialConfig,
                    connector.connectorConfig,
                    'dc.smartproxy.com'
                );
            }

            case ESmartproxyCredentialType.DC_SHARED: {
                return new ConnectorSmartproxyEndpointsService(
                    credentialConfig,
                    connector.connectorConfig,
                    TRANSPORT_SMARTPROXY_ENDPOINTS_DC_TYPE,
                    this.endpointsDC
                );
            }

            case ESmartproxyCredentialType.ISP_DEDICATED:
            case ESmartproxyCredentialType.ISP_SHARED: {
                return new ConnectorSmartproxyServerService(
                    credentialConfig,
                    connector.connectorConfig,
                    'isp.smartproxy.com'
                );
            }

            case ESmartproxyCredentialType.RESIDENTIAL: {
                return new ConnectorSmartproxyEndpointsService(
                    credentialConfig,
                    connector.connectorConfig,
                    TRANSPORT_SMARTPROXY_ENDPOINTS_RESIDENTIAL_TYPE,
                    this.endpointsResidential
                );
            }

            default: {
                throw new Error('Unknown Smartproxy credential type');
            }
        }
    }

    async buildInstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async buildUninstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async validateInstallCommand(): Promise<void> {
        // Nothing to install
    }

    async queryCredential(): Promise<any> {
        throw new Error('Not implemented');
    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }

    private loadEndpoints(filename: string): Promise<ISmartproxyEndpoint[]> {
        return new Promise<ISmartproxyEndpoint[]>((
            resolve, reject
        ) => {
            const stream = fs.createReadStream(filename);
            const chunks: Buffer[] = [];
            stream.pipe(createGunzip())
                .on(
                    'error',
                    (err: any) => {
                        reject(err);
                    }
                )
                .on(
                    'data',
                    (chunk: Buffer) => {
                        chunks.push(chunk);
                    }
                )
                .on(
                    'end',
                    () => {
                        const str = Buffer.concat(chunks)
                            .toString();
                        const endpoints = JSON.parse(str) as ISmartproxyEndpoint[];
                        resolve(endpoints);
                    }
                );
        });
    }
}
