import * as fs from 'fs';
import { ConnectorXProxyModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_XPROXY_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - XProxy',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/xproxy/credentials.json');
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
