import * as fs from 'fs';
import { ConnectorHypeproxyModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_HYPEPROXY_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - HypeProxy',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/hypeproxy/credentials.json');
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
                ConnectorHypeproxyModule,
            ],
            CONNECTOR_HYPEPROXY_TYPE,
            credentialConfig,
            {}
        );
    }
);
