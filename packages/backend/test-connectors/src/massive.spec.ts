import * as fs from 'fs';
import {
    ConnectorMassiveModule,
    IConnectorMassiveConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_MASSIVE_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Massive',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/massive/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorMassiveModule,
            ],
            CONNECTOR_MASSIVE_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on Residential',
                            config: {
                                country: 'all',
                            } satisfies IConnectorMassiveConfig,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
