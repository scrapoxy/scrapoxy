import * as fs from 'fs';
import { ConnectorDecodoModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_DECODO_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Decodo',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/decodo/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorDecodoModule,
            ],
            CONNECTOR_DECODO_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on ISP shared',
                            config: {
                                country: 'all',
                                sessionDuration: 10,
                            },
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
