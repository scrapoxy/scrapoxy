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
        const
            credentialConfigApiData = fs.readFileSync('packages/backend/test-connectors/src/assets/zyte/credentials-api.json'),
            credentialConfigSpmData = fs.readFileSync('packages/backend/test-connectors/src/assets/zyte/credentials-spm.json');


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
                    name: 'Zyte API Credential',
                    config: JSON.parse(credentialConfigApiData.toString()),
                    connectors: [
                        {
                            name: 'Test Zyte API (USA)',
                            config: {
                                region: 'us',
                                apiUrl: 'api.zyte.com:8011',
                            } satisfies IConnectorZyteConfig,
                        },
                    ],
                },
                {
                    name: 'Smart Proxy Manager Credential',
                    config: JSON.parse(credentialConfigSpmData.toString()),
                    connectors: [
                        {
                            name: 'Test Smart Proxy Manager (France)',
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
