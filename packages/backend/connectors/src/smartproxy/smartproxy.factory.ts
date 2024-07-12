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
import { ConnectorSmartproxyResidentialService } from './smartproxy-residential.service';
import { ConnectorSmartproxyServerService } from './smartproxy-server.service';
import {
    schemaConfig,
    schemaCredential,
} from './smartproxy.validation';
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

    private readonly endpoints = new Map<string, ISmartproxyEndpoint>();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async onModuleInit(): Promise<void> {
        const endpoints = await this.loadEndpoints(resolvePath(
            getEnvAssetsPath(),
            'connectors',
            'smartproxy',
            'endpoints.json.gz'
        ));

        this.endpoints.clear();
        for (const endpoint of endpoints) {
            this.endpoints.set(
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
                    'dc.smartproxy.com'
                );
            }

            case ESmartproxyCredentialType.ISP_DEDICATED:
            case ESmartproxyCredentialType.ISP_SHARED: {
                return new ConnectorSmartproxyServerService(
                    credentialConfig,
                    'isp.smartproxy.com'
                );
            }

            case ESmartproxyCredentialType.RESIDENTIAL: {
                return new ConnectorSmartproxyResidentialService(
                    credentialConfig,
                    connector.connectorConfig,
                    this.endpoints
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
