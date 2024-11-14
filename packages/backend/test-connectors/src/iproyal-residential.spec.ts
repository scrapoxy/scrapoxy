import * as fs from 'fs';
import {
    ConnectorIproyalResidentialModule,
    IConnectorIproyalResidentialConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_IPROYAL_RESIDENTIAL_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Iproyal Residential',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/iproyal-residential/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorIproyalResidentialModule,
            ],
            CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on Residential',
                            config: {
                                lifetime: '24h',
                                country: 'all',
                                highEndPool: false,
                            } satisfies IConnectorIproyalResidentialConfig,
                        },
                    ],
                },
            ]
        );
    }
);
