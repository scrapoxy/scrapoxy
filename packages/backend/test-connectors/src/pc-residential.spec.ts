import * as fs from 'fs';
import {
    Agents,
    ConnectorProxyCheapResidentialModule,
    IConnectorProxyCheapResidentialConfig,
} from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxy-Cheap Residential',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorProxyCheapResidentialConfig = {
                country: 'All',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxy-cheap-residential/credentials.json');
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
