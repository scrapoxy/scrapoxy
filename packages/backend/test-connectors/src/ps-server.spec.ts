import * as fs from 'fs';
import {
    ConnectorProxySellerServerModule,
    IConnectorProxySellerServerConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_PROXY_SELLER_SERVER_TYPE,
    EProxySellerNetworkType,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Proxy-Seller Server',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorProxySellerServerConfig = {
                networkType: EProxySellerNetworkType.ALL,
                country: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxy-seller-server/credentials.json');
        const credentialConfig = JSON.parse(credentialConfigData.toString());

        afterAll(() => {
            agents.close();
        });

        testConnector(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorProxySellerServerModule,
            ],
            CONNECTOR_PROXY_SELLER_SERVER_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
