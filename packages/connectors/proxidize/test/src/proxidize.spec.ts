import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorProxidizeModule } from '@scrapoxy/connector-proxidize-backend';
import { CONNECTOR_PROXIDIZE_TYPE } from '@scrapoxy/connector-proxidize-sdk';


describe(
    'Connector Provider - Proxidize',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/connectors/proxidize/test/src/assets/credentials.json');
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
