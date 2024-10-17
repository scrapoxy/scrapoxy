import * as fs from 'fs';
import {
    ConnectorProxyrackModule,
    EProxyrackOs,
    IConnectorProxyrackConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXYRACK_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxyrack',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxyrack/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorProxyrackModule,
            ],
            CONNECTOR_PROXYRACK_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on Unmetered Residential',
                            config: {
                                country: 'all',
                                city: 'all',
                                isp: 'all',
                                osName: EProxyrackOs.All,
                            } satisfies IConnectorProxyrackConfig,
                        },
                    ],
                },
            ]
        );
    }
);
