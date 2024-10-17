import * as fs from 'fs';
import {
    ConnectorProxySellerServerModule,
    IConnectorProxySellerServerConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_PROXY_SELLER_SERVER_TYPE,
    EProxySellerNetworkType,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Proxy-Seller Server',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxy-seller-server/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorProxySellerServerModule,
            ],
            CONNECTOR_PROXY_SELLER_SERVER_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on static',
                            config: {
                                networkType: EProxySellerNetworkType.ALL,
                                country: 'all',
                            } satisfies IConnectorProxySellerServerConfig,
                        },
                    ],
                },
            ]
        );
    }
);
