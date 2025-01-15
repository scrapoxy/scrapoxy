import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_ZYTE_TYPE,
    EZyteCredentialType,
} from '@scrapoxy/common';
import {
    ZyteApi,
    ZyteSmartProxyManagerApi,
} from './api';
import { ConnectorZyteApiService } from './zyte-api.service';
import { ConnectorZyteSmartProxyManagerService } from './zyte-spm.service';
import {
    schemaConfig,
    schemaCredential,
} from './zyte.validation';
import type {
    IConnectorZyteConfig,
    IConnectorZyteCredential,
} from './zyte.interface';
import type { OnModuleDestroy } from '@nestjs/common';
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
export class ConnectorZyteFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_ZYTE_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    private readonly agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorZyteCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            switch (config.credentialType) {
                case EZyteCredentialType.ZYTE_API: {
                    const api = new ZyteApi(
                        config.token,
                        this.agents
                    );
                    const valid = await api.testToken();

                    if (!valid) {
                        throw new CredentialInvalidError('Invalid token');
                    }

                    break;
                }

                case EZyteCredentialType.SMART_PROXY_MANAGER: {
                    const api = new ZyteSmartProxyManagerApi(
                        config.token,
                        this.agents
                    );

                    await api.getAllSessions();

                    break;
                }

                default: {
                    throw new CredentialInvalidError('Unknown Zyte credential type');
                }
            }

        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<IConnectorZyteCredential> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorZyteCredential,
        connectorConfig: IConnectorZyteConfig
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
        const credentialConfig = connector.credentialConfig as IConnectorZyteCredential;

        switch (credentialConfig.credentialType) {
            case EZyteCredentialType.ZYTE_API: {
                return new ConnectorZyteApiService(connector.connectorConfig);
            }

            case EZyteCredentialType.SMART_PROXY_MANAGER: {
                return new ConnectorZyteSmartProxyManagerService(
                    credentialConfig,
                    connector.connectorConfig,
                    this.agents
                );
            }

            default: {
                throw new Error('Unknown Zyte credential type');
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
        // Nothing
    }

    async queryCredential(): Promise<any> {
        throw new Error('Not implemented');
    }
}
