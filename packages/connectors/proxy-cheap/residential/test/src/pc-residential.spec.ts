import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    ConnectorProxyCheapResidentialModule,
    IConnectorProxyCheapResidentialConfig,
} from '@scrapoxy/connector-proxy-cheap-residential-backend';
import { CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE } from '@scrapoxy/connector-proxy-cheap-residential-sdk';


describe(
    'Connector Provider - Proxy-Cheap Residential',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorProxyCheapResidentialConfig = {
                country: 'All',
            },
            credentialConfigData = fs.readFileSync('packages/connectors/proxy-cheap/residential/test/src/assets/credentials.json');
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
                ConnectorProxyCheapResidentialModule,
            ],
            CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
