import * as fs from 'fs';
import { resolve as resolvePath } from 'path';
import { createGunzip } from 'zlib';
import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    getEnvAssetsPath,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE,
    EProxySellerResidentialQueryCredential,
} from '@scrapoxy/common';
import { ProxySellerResidentialApi } from './api';
import { toProxySellerGeoCountryView } from './ps-residential.helpers';
import { ConnectorProxySellerResidentialService } from './ps-residential.service';
import {
    schemaConfig,
    schemaCredential,
} from './ps-residential.validation';
import type {
    IConnectorProxySellerResidentialConfig,
    IConnectorProxySellerResidentialCredential,
    IProxySellerGeoCountryData,
} from './ps-residential.interface';
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
    IConnectorProxySellerResidentialQueryCities,
    IConnectorProxySellerResidentialQueryIsps,
    IConnectorProxySellerResidentialQueryRegions,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IProxySellerGeoCountryView,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorProxySellerResidentialFactory implements IConnectorFactory, OnModuleInit, OnModuleDestroy {
    readonly type = CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    private readonly agents: Agents = new Agents();

    private geos: IProxySellerGeoCountryData[] = [];

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async onModuleInit(): Promise<void> {
        this.geos = await this.loadGeoDB(resolvePath(
            getEnvAssetsPath(),
            'connectors',
            'proxy-seller',
            'geo.json.gz'
        ));
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorProxySellerResidentialCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new ProxySellerResidentialApi(
                config.token,
                this.agents
            );

            await api.ping();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorProxySellerResidentialCredential,
        connectorConfig: IConnectorProxySellerResidentialConfig
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
        return new ConnectorProxySellerResidentialService(
            connector.credentialConfig,
            connector.connectorConfig,
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

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        switch (query.type) {
            case EProxySellerResidentialQueryCredential.Countries: {
                return this.queryCountries();
            }

            case EProxySellerResidentialQueryCredential.Regions: {
                return this.queryRegions(query.parameters);
            }

            case EProxySellerResidentialQueryCredential.Cities: {
                return this.queryCities(query.parameters);
            }

            case EProxySellerResidentialQueryCredential.Isps: {
                return this.queryIsps(query.parameters);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }

    private async queryCountries(): Promise<IProxySellerGeoCountryView[]> {
        const countries: IProxySellerGeoCountryView[] = this.geos.map(toProxySellerGeoCountryView);

        return countries;
    }

    private async queryRegions(parameters: IConnectorProxySellerResidentialQueryRegions): Promise<string[]> {
        const country = this.geos.find((p) => p.code === parameters.countryCode);

        if (!country) {
            return [];
        }

        const regions = country.regions.map((p) => p.name);

        return regions;
    }

    private async queryCities(parameters: IConnectorProxySellerResidentialQueryCities): Promise<string[]> {
        const country = this.geos.find((p) => p.code === parameters.countryCode);

        if (!country) {
            return [];
        }

        const region = country.regions.find((p) => p.name === parameters.region);

        if (!region) {
            return [];
        }

        const cities = region.cities.map((p) => p.name);

        return cities;
    }

    private async queryIsps(parameters: IConnectorProxySellerResidentialQueryIsps): Promise<string[]> {
        const country = this.geos.find((p) => p.code === parameters.countryCode);

        if (!country) {
            return [];
        }

        const region = country.regions.find((p) => p.name === parameters.region);

        if (!region) {
            return [];
        }

        const city = region.cities.find((p) => p.name === parameters.city);

        if (!city) {
            return [];
        }

        return city.isps;
    }

    private loadGeoDB(filename: string): Promise<IProxySellerGeoCountryData[]> {
        return new Promise<IProxySellerGeoCountryData[]>((
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
                        const geo = JSON.parse(str) as IProxySellerGeoCountryData[];

                        for (const country of geo) {
                            country.code = country.code.toLowerCase();
                        }

                        resolve(geo);
                    }
                );
        });
    }
}
