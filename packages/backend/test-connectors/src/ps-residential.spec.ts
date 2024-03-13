import * as fs from 'fs';
import {
    ConnectorProxySellerResidentialModule,
    IConnectorProxySellerResidentialConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxy-Seller Residential',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorProxySellerResidentialConfig = {
                countryCode: 'all',
                region: 'all',
                city: 'all',
                isp: 'all',
                title: 'spx-test',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxy-seller-residential/credentials.json');
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
                ConnectorProxySellerResidentialModule,
            ],
            CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
