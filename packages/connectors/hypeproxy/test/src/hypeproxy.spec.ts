import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorHypeproxyModule } from '@scrapoxy/connector-hypeproxy-backend';
import { CONNECTOR_HYPEPROXY_TYPE } from '@scrapoxy/connector-hypeproxy-sdk';


describe(
    'Connector Provider - HypeProxy',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/connectors/hypeproxy/test/src/assets/credentials.json');
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
