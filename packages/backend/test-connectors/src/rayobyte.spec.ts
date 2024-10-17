import * as fs from 'fs';
import { ConnectorRayobyteModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_RAYOBYTE_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Rayobyte',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/rayobyte/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorRayobyteModule,
            ],
            CONNECTOR_RAYOBYTE_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on ISP',
                            config: {
                                packageFilter: 'all',
                            },
                        },
                    ],
                },
            ]
        );
    }
);
