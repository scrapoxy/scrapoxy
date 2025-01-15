import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_LIVEPROXIES_TYPE,
    ELiveproxiesPlanStatus,
    ELiveproxiesQueryCredential,
    isLiveproxiesEnterprisePlan,
} from '@scrapoxy/common';
import { LiveproxiesApi } from './api';
import { ConnectorLiveproxiesB2bService } from './liveproxies-b2b.service';
import { ConnectorLiveproxiesB2cService } from './liveproxies-b2c.service';
import { toLiveproxiesPlanB2C } from './liveproxies.helpers';
import {
    schemaConfig,
    schemaCredential,
} from './liveproxies.validation';
import type {
    IConnectorLiveproxiesConfig,
    IConnectorLiveproxiesCredential,
} from './liveproxies.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ILiveproxiesPlanB2C,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorLiveproxiesFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_LIVEPROXIES_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorLiveproxiesCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new LiveproxiesApi(
                config.apiKey,
                this.agents
            );

            await api.getAllPlans();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorLiveproxiesCredential,
        connectorConfig: IConnectorLiveproxiesConfig
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
        const config = connector.connectorConfig as IConnectorLiveproxiesConfig;

        if (isLiveproxiesEnterprisePlan(config.productName)) {
            return new ConnectorLiveproxiesB2bService(
                connector.credentialConfig,
                connector.connectorConfig,
                this.agents
            );
        } else {
            return new ConnectorLiveproxiesB2cService(
                connector.credentialConfig,
                connector.connectorConfig,
                this.agents
            );
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

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorLiveproxiesCredential;

        switch (query.type) {
            case ELiveproxiesQueryCredential.Plans: {
                return this.queryPlans(credentialConfig);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    private async queryPlans(credentialConfig: IConnectorLiveproxiesCredential): Promise<ILiveproxiesPlanB2C[]> {
        const api = new LiveproxiesApi(
            credentialConfig.apiKey,
            this.agents
        );
        const plans = (await api.getAllPlans()) as ILiveproxiesPlanB2C[];
        const plansFiltered = plans
            .filter((p) => p.packageStatus === ELiveproxiesPlanStatus.ACTIVE)
            .map(toLiveproxiesPlanB2C);

        return plansFiltered;
    }
}
