import * as fs from 'fs';
import {
    ConnectorBrightdataModule,
    IConnectorBrightdataConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_BRIGHTDATA_TYPE,
    EBrightdataProductType,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Brightdata',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/brightdata/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorBrightdataModule,
            ],
            CONNECTOR_BRIGHTDATA_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on ISP shared',
                            config: {
                                zoneName: 'isp_shared',
                                zoneType: EBrightdataProductType.RESIDENTIAL,
                                country: 'us',
                            } satisfies IConnectorBrightdataConfig,
                        },
                    ],
                },
            ]
        );
    }
);
