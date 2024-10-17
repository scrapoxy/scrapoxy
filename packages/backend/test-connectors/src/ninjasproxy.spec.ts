import * as fs from 'fs';
import { ConnectorNinjasproxyModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_NINJASPROXY_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Ninjas proxy',
    () => {
        const agents = new Agents(),
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/ninjasproxy/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorNinjasproxyModule,
            ],
            CONNECTOR_NINJASPROXY_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on proxies',
                        },
                    ],
                },
            ]
        );
    }
);
