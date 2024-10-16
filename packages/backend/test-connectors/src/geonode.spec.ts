import * as fs from 'fs';
import {
    ConnectorGeonodeModule,
    IConnectorGeonodeConfig,
    IConnectorGeonodeCredential,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_GEONODE_TYPE,
    EGeonodeProductType,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Geonode',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/geonode/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorGeonodeModule,
            ],
            CONNECTOR_GEONODE_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()) as IConnectorGeonodeCredential,
                    connectors: [
                        {
                            name: 'Test on Residential Premium',
                            config: {
                                productType: EGeonodeProductType.RESIDENTIAL_PREMIUM,
                                country: 'all',
                                lifetime: 10,
                            } satisfies IConnectorGeonodeConfig,
                        },
                        {
                            name: 'Test on Shared Datacenter',
                            config: {
                                productType: EGeonodeProductType.SHARED_DATACENTER,
                                country: 'all',
                                lifetime: 10,
                            } satisfies IConnectorGeonodeConfig,
                        },
                    ],
                },
            ]
        );
    }
);
