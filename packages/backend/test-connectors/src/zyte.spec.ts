import * as fs from 'fs';
import {
    ConnectorZyteModule,
    IConnectorZyteConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_ZYTE_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Zyte',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/zyte/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorZyteModule,
            ],
            CONNECTOR_ZYTE_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test Smart Proxy Manager',
                            config: {
                                region: 'fr',
                                apiUrl: 'proxy.crawlera.com:8011',
                            } satisfies IConnectorZyteConfig,
                        },
                    ],
                },
            ]
        );
    }
);
