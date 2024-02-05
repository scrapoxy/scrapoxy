import * as fs from 'fs';
import {
    ConnectorProxyCheapServerModule,
    EProxyCheapNetworkType,
    IConnectorProxyCheapServerConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXY_CHEAP_SERVER_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxy-Cheap Server',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorProxyCheapServerConfig = {
                networkType: EProxyCheapNetworkType.ALL,
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxy-cheap-server/credentials.json');
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
                ConnectorProxyCheapServerModule,
            ],
            CONNECTOR_PROXY_CHEAP_SERVER_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
