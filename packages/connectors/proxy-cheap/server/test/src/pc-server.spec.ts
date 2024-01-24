import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    ConnectorProxyCheapServerModule,
    EProxyCheapNetworkType,
    IConnectorProxyCheapServerConfig,
} from '@scrapoxy/connector-proxy-cheap-server-backend';
import { CONNECTOR_PROXY_CHEAP_SERVER_TYPE } from '@scrapoxy/connector-proxy-cheap-server-sdk';


describe(
    'Connector Provider - Proxy-Cheap Server',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorProxyCheapServerConfig = {
                networkType: EProxyCheapNetworkType.ALL,
            },
            credentialConfigData = fs.readFileSync('packages/connectors/proxy-cheap/server/test/src/assets/credentials.json');
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
