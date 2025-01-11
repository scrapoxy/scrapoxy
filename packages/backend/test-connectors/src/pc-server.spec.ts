import * as fs from 'fs';
import {
    ConnectorProxyCheapServerModule,
    EProxyCheapNetworkType,
    IConnectorProxyCheapServerConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXY_CHEAP_SERVER_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxy-Cheap Server',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxy-cheap-server/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorProxyCheapServerModule,
            ],
            CONNECTOR_PROXY_CHEAP_SERVER_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on static',
                            config: {
                                networkType: EProxyCheapNetworkType.ALL,
                            } satisfies IConnectorProxyCheapServerConfig,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
