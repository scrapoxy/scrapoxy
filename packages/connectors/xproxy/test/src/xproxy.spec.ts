import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorXProxyModule } from '@scrapoxy/connector-xproxy-backend';
import { CONNECTOR_XPROXY_TYPE } from '@scrapoxy/connector-xproxy-sdk';


describe(
    'Connector Provider - XProxy',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/connectors/xproxy/test/src/assets/credentials.json');
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
                ConnectorXProxyModule,
            ],
            CONNECTOR_XPROXY_TYPE,
            credentialConfig,
            {}
        );
    }
);
