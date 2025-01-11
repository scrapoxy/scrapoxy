import * as fs from 'fs';
import {
    ConnectorNetnutModule,
    EConnectorNetnutProxyType,
    IConnectorNetnutConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_NETNUT_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - NetNut',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/netnut/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorNetnutModule,
            ],
            CONNECTOR_NETNUT_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on Residential in the USA',
                            config: {
                                proxyType: EConnectorNetnutProxyType.RES,
                                country: 'us',
                            } satisfies IConnectorNetnutConfig,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
