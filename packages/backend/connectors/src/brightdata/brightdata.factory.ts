import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_BRIGHTDATA_TYPE,
    EBrightdataProductType,
    EBrightdataQueryCredential,
} from '@scrapoxy/common';
import { BrightdataApi } from './api';
import { ConnectorBrightdataResidentialService } from './brightdata-residential.service';
import { ConnectorBrightdataServerService } from './brightdata-server.service';
import {
    toBrightdataCountryProductType,
    toBrightdataProductType,
} from './brightdata.helpers';
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
    IBrightdataQueryZone,
    IBrightdataUsername,
    IBrightdataZoneView,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ITaskToCreate,
} from '@scrapoxy/common';


const
    COUNTRY_CODES = [
        'ae',
        'al',
        'am',
        'ar',
        'at',
        'au',
        'az',
        'ba',
        'bd',
        'be',
        'bg',
        'bo',
        'br',
        'by',
        'ca',
        'ch',
        'cl',
        'cn',
        'co',
        'cr',
        'cy',
        'cz',
        'de',
        'dk',
        'do',
        'ec',
        'ee',
        'eg',
        'es',
        'fi',
        'fr',
        'gb',
        'ge',
        'gh',
        'gr',
        'hk',
        'hr',
        'hu',
        'id',
        'ie',
        'il',
        'im',
        'in',
        'iq',
        'is',
        'it',
        'jm',
        'jo',
        'jp',
        'ke',
        'kg',
        'kh',
        'kr',
        'kw',
        'kz',
        'la',
        'lk',
        'lt',
        'lu',
        'lv',
        'ma',
        'md',
        'mk',
        'mm',
        'mx',
        'my',
        'ng',
        'nl',
        'no',
        'nz',
        'om',
        'pa',
        'pe',
        'ph',
        'pk',
        'pl',
        'pt',
        'qa',
        'ro',
        'rs',
        'ru',
        'sa',
        'se',
        'sg',
        'si',
        'sk',
        'sl',
        'th',
        'tj',
        'tm',
        'tn',
        'tr',
        'tw',
        'tz',
        'ua',
        'us',
        'uy',
        'uz',
        'vn',
        'za',
        'zm',
    ],
    PRODUCTS_FILTER = [
        'dc',
        'res_static',
        'res_rotating',
        'mobile',
    ];


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

        switch (connectorConfig.productType) {
            // Residential
            case EBrightdataProductType.DATACENTER_SHARED_PAYPERUSAGE:
            case EBrightdataProductType.ISP_SHARED_PAYPERUSAGE:
            case EBrightdataProductType.RESIDENTIAL_SHARED:
            case EBrightdataProductType.RESIDENTIAL_DEDICATED:
            case EBrightdataProductType.MOBILE_SHARED:
            case EBrightdataProductType.MOBILE_DEDICATED:{
                return new ConnectorBrightdataResidentialService(connectorConfig);
            }

            // Server
            case EBrightdataProductType.DATACENTER_SHARED_UNLIMITED:
            case EBrightdataProductType.DATACENTER_DEDICATED_UNLIMITED:
            case EBrightdataProductType.ISP_SHARED_UNLIMITED:
            case EBrightdataProductType.ISP_DEDICATED_UNLIMITED: {
                return new ConnectorBrightdataServerService(
                    connector.credentialConfig,
                    connectorConfig,
                    this.agents
                );
            }

            default: {
                throw new Error('Unknown product type');
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
            case EBrightdataQueryCredential.Username: {
                return this.queryUsername(credentialConfig);
            }

            case EBrightdataQueryCredential.Zone: {
                return this.queryZone(
                    credentialConfig,
                    query.parameters as IBrightdataQueryZone
                );
            }

            case EBrightdataQueryCredential.Zones: {
                return this.queryZones(credentialConfig);
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryUsername(credentialConfig: IConnectorBrightdataCredential): Promise<IBrightdataUsername> {
        const api = new BrightdataApi(
            credentialConfig.token,
            this.agents
        );
        const status = await api.getStatus();

        return {
            username: status.customer,
        };
    }

    private async queryZones(credentialConfig: IConnectorBrightdataCredential): Promise<string[]> {
        const api = new BrightdataApi(
            credentialConfig.token,
            this.agents
        );
        const zones = await api.getAllActiveZones();
        const zonesFiltered = zones.filter((zone) => PRODUCTS_FILTER.includes(zone.type))
            .map((zone) => zone.name);

        return zonesFiltered;
    }

    private async queryZone(
        credentialConfig: IConnectorBrightdataCredential,
        parameters: IBrightdataQueryZone
    ): Promise<IBrightdataZoneView> {
        const api = new BrightdataApi(
            credentialConfig.token,
            this.agents
        );
        const zone = await api.getZone(parameters.zoneName);
        const productType = toBrightdataProductType(zone);

        if (!productType) {
            throw new Error('Unknown product type');
        }

        if (!zone.password || zone.password.length <= 0) {
            throw new Error('Zone password is empty');
        }

        let countries: string[];
        switch (productType) {
            case EBrightdataProductType.RESIDENTIAL_SHARED:
            case EBrightdataProductType.MOBILE_SHARED: {
                countries = COUNTRY_CODES;
                break;
            }

            case EBrightdataProductType.RESIDENTIAL_DEDICATED:
            case EBrightdataProductType.MOBILE_DEDICATED: {
                if (zone.plan?.vip_country && zone.plan.vip_country.length > 0) {
                    countries = zone.plan.vip_country.split(' ');
                } else {
                    countries = [];
                }
                break;
            }

            default: {
                countries = await api.getCountries(toBrightdataCountryProductType(productType));
                break;
            }
        }

        return {
            name: parameters.zoneName,
            productType,
            password: zone.password[ 0 ],
            countries,
        };
    }
}
