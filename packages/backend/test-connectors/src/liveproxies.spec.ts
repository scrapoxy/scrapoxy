import * as fs from 'fs';
import { ConnectorLiveproxiesModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_LIVEPROXIES_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Live Proxies',
    () => {
        const agents = new Agents();
        const connectorConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/liveproxies/config.json'),
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/liveproxies/credentials.json');
        const
            connectorConfig = JSON.parse(connectorConfigData.toString()),
            credentialConfig = JSON.parse(credentialConfigData.toString());

        afterAll(() => {
            agents.close();
        });

        testConnector(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorLiveproxiesModule,
            ],
            CONNECTOR_LIVEPROXIES_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
