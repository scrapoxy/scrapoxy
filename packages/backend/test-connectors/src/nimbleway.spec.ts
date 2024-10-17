import * as fs from 'fs';
import { ConnectorNimblewayModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_NIMBLEWAY_TYPE } from '@scrapoxy/common';
import type { IConnectorNimblewayConfig } from '@scrapoxy/backend-connectors';


describe(
    'Connector Provider - Nimbleway',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/nimbleway/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorNimblewayModule,
            ],
            CONNECTOR_NIMBLEWAY_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on Residential',
                            config: {
                                country: 'all',
                            } satisfies IConnectorNimblewayConfig,
                        },
                    ],
                },
            ]
        );
    }
);
