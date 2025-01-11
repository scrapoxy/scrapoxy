import * as fs from 'fs';
import { ConnectorProxidizeModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXIDIZE_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxidize',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxidize/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorProxidizeModule,
            ],
            CONNECTOR_PROXIDIZE_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on hardware',
                            config: void 0,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
