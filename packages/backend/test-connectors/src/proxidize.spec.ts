import * as fs from 'fs';
import { ConnectorProxidizeModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXIDIZE_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Proxidize',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxidize/credentials.json');
        const credentialConfig = JSON.parse(credentialConfigData.toString());

        afterAll(() => {
            agents.close();
        });

        testConnector(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorProxidizeModule,
            ],
            CONNECTOR_PROXIDIZE_TYPE,
            credentialConfig,
            {}
        );
    }
);
