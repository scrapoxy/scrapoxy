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
    CONNECTOR_DECODO_TYPE,
    EDecodoCredentialType,
} from '@scrapoxy/common';
import { ConnectorDecodoEndpointsService } from './decodo-endpoints.service';
import { ConnectorDecodoServerService } from './decodo-server.service';
import {
    schemaConfig,
    schemaCredential,
} from './decodo.validation';
import {
    TRANSPORT_DECODO_ENDPOINTS_DC_TYPE,
    TRANSPORT_DECODO_ENDPOINTS_RESIDENTIAL_TYPE,
} from './transport';
import type {
    IConnectorDecodoConfig,
    IConnectorDecodoCredential,
    IDecodoEndpoint,
} from './decodo.interface';
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
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorDecodoFactory implements IConnectorFactory, OnModuleInit, OnModuleDestroy {
    readonly type = CONNECTOR_DECODO_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    private readonly endpointsDC = new Map<string, IDecodoEndpoint>();

    private readonly endpointsResidential = new Map<string, IDecodoEndpoint>();

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
                'decodo',
                'endpoints-dc.json.gz'
            )),
            this.loadEndpoints(resolvePath(
                getEnvAssetsPath(),
                'connectors',
                'decodo',
                'endpoints-residential.json.gz'
            )),
        ]);

        this.endpointsDC.clear();
        this.endpointsDC.set(
            'all',
            {
                code: 'all',
                hostname: 'all.dc.decodo.com',
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
                hostname: 'gate.decodo.com',
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

    async validateCredentialConfig(config: IConnectorDecodoCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorDecodoCredential,
        connectorConfig: IConnectorDecodoConfig
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
        const credentialConfig = connector.credentialConfig as IConnectorDecodoCredential;

        switch (credentialConfig.credentialType) {
            case EDecodoCredentialType.DC_DEDICATED: {
                return new ConnectorDecodoServerService(
                    credentialConfig,
                    connector.connectorConfig,
                    'dc.decodo.com'
                );
            }

            case EDecodoCredentialType.DC_SHARED: {
                return new ConnectorDecodoEndpointsService(
                    credentialConfig,
                    connector.connectorConfig,
                    TRANSPORT_DECODO_ENDPOINTS_DC_TYPE,
                    this.endpointsDC
                );
            }

            case EDecodoCredentialType.ISP_DEDICATED:
            case EDecodoCredentialType.ISP_SHARED: {
                return new ConnectorDecodoServerService(
                    credentialConfig,
                    connector.connectorConfig,
                    'isp.decodo.com'
                );
            }

            case EDecodoCredentialType.RESIDENTIAL: {
                return new ConnectorDecodoEndpointsService(
                    credentialConfig,
                    connector.connectorConfig,
                    TRANSPORT_DECODO_ENDPOINTS_RESIDENTIAL_TYPE,
                    this.endpointsResidential
                );
            }

            default: {
                throw new Error('Unknown Decodo credential type');
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

    private loadEndpoints(filename: string): Promise<IDecodoEndpoint[]> {
        return new Promise<IDecodoEndpoint[]>((
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
                        const endpoints = JSON.parse(str) as IDecodoEndpoint[];
                        resolve(endpoints);
                    }
                );
        });
    }
}
