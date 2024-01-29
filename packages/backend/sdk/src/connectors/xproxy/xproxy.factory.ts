import { Injectable } from '@nestjs/common';
import { CONNECTOR_XPROXY_TYPE } from '@scrapoxy/common';
import { IXproxyApi } from './api';
import { ConnectorXProxyService } from './xproxy.service';
import { schemaCredential } from './xproxy.validation';
import { CredentialInvalidError } from '../../errors';
import {
    Agents,
    validate,
} from '../../helpers';
import { TRANSPORT_HARDWARE_TYPE } from '../../transports';
import { ConnectorprovidersService } from '../providers.service';
import type { IConnectorXProxyCredential } from './xproxy.interface';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '../providers.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorListProxies,
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorXProxyFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_XPROXY_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_HARDWARE_TYPE,
        useCertificate: false,
    };

    private readonly agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorXProxyCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new IXproxyApi(
                config.apiUrl,
                config.apiUsername,
                config.apiPassword,
                this.agents
            );

            await api.getDevices();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(): Promise<void> {
        // Nothing to validate
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        return new ConnectorXProxyService(
            connector.credentialConfig,
            this.agents
        );
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
}
