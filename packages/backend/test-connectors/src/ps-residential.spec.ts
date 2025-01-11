import * as fs from 'fs';
import {
    ConnectorProxySellerResidentialModule,
    IConnectorProxySellerResidentialConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxy-Seller Residential',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxy-seller-residential/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorProxySellerResidentialModule,
            ],
            CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on Residential',
                            config: {
                                countryCode: 'all',
                                region: 'all',
                                city: 'all',
                                isp: 'all',
                                title: 'spx-test',
                            } satisfies IConnectorProxySellerResidentialConfig,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
