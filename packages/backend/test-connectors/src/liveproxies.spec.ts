import * as fs from 'fs';
import {
    ConnectorLiveproxiesModule,
    IConnectorLiveproxiesConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_LIVEPROXIES_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Live Proxies',
    () => {
        const agents = new Agents();
        const connectorConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/liveproxies/config.json'),
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/liveproxies/credentials.json');
        const connectorConfig = JSON.parse(connectorConfigData.toString()) as IConnectorLiveproxiesConfig;

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorLiveproxiesModule,
            ],
            CONNECTOR_LIVEPROXIES_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: `Test on ${connectorConfig.productName}`,
                            config: connectorConfig,
                        },
                    ],
                },
            ]
        );
    }
);
