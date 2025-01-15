import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    BRIGHTDATA_PRODUCT_TYPES,
    CONNECTOR_BRIGHTDATA_TYPE,
    EBrightdataProductType,
    EBrightdataQueryCredential,
} from '@scrapoxy/common';
import { BrightdataApi } from './api';
import { ConnectorBrightdataResidentialService } from './brightdata-residential.service';
import { ConnectorBrightdataServerService } from './brightdata-server.service';
import { toBrightdataZoneView } from './brightdata.helpers';
import { EBrightdataStatus } from './brightdata.interface';
import {
    schemaConfig,
    schemaCredential,
} from './brightdata.validation';
import type {
    IConnectorBrightdataConfig,
    IConnectorBrightdataCredential,
} from './brightdata.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IBrightdataZoneView,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorBrightdataFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_BRIGHTDATA_TYPE;

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

    async validateCredentialConfig(config: IConnectorBrightdataCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new BrightdataApi(
                config.token,
                this.agents
            );
            const status = await api.getStatus();

            if (status?.status !== EBrightdataStatus.ACTIVE) {
                throw new CredentialInvalidError('Brightdata account API is inactive');
            }
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorBrightdataCredential,
        connectorConfig: IConnectorBrightdataConfig
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
        const connectorConfig = connector.connectorConfig as IConnectorBrightdataConfig;

        switch (connectorConfig.zoneType) {
            case EBrightdataProductType.MOBILE:
            case EBrightdataProductType.RESIDENTIAL: {
                return new ConnectorBrightdataResidentialService(
                    connector.credentialConfig,
                    connectorConfig,
                    this.agents
                );
            }

            case EBrightdataProductType.DATACENTER:
            case EBrightdataProductType.ISP: {
                return new ConnectorBrightdataServerService(
                    connector.credentialConfig,
                    connectorConfig,
                    this.agents
                );
            }

            default: {
                throw new Error('Unknown zone type');
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

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorBrightdataCredential;

        switch (query.type) {
            case EBrightdataQueryCredential.Zones: {
                return this.queryZones(credentialConfig);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    private async queryZones(credentialConfig: IConnectorBrightdataCredential): Promise<IBrightdataZoneView[]> {
        const api = new BrightdataApi(
            credentialConfig.token,
            this.agents
        );
        const zones = await api.getAllActiveZones();
        const zonesFiltered = zones.filter((zone) => BRIGHTDATA_PRODUCT_TYPES.includes(zone.type));

        return zonesFiltered.map(toBrightdataZoneView);
    }
}
