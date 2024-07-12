import * as fs from 'fs';
import {
    ConnectorSmartproxyModule,

    IConnectorSmartproxyConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_SMARTPROXY_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Smartproxy',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorSmartproxyConfig = {
                country: 'all',
                sessionDuration: 10,
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/smartproxy/credentials.json');
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
                ConnectorSmartproxyModule,
            ],
            CONNECTOR_SMARTPROXY_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
