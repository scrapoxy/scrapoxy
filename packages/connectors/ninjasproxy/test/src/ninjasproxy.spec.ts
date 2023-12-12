import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorNinjasproxyModule } from '@scrapoxy/connector-ninjasproxy-backend';
import { CONNECTOR_NINJASPROXY_TYPE } from '@scrapoxy/connector-ninjasproxy-sdk';


describe(
    'Connector Provider - Ninjas proxy',
    () => {
        const agents = new Agents(),
            credentialConfigData = fs.readFileSync('packages/connectors/ninjasproxy/test/src/assets/credentials.json');
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
                ConnectorNinjasproxyModule,
            ],
            CONNECTOR_NINJASPROXY_TYPE,
            credentialConfig,
            {}
        );
    }
);
