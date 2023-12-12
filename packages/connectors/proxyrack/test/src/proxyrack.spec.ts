import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    ConnectorProxyrackModule,
    EProxyrackOs,
} from '@scrapoxy/connector-proxyrack-backend';
import { CONNECTOR_PROXYRACK_TYPE } from '@scrapoxy/connector-proxyrack-sdk';
import type { IConnectorProxyrackConfig } from '@scrapoxy/connector-proxyrack-backend';


describe(
    'Connector Provider - Proxyrack',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorProxyrackConfig = {
                country: 'all',
                city: 'all',
                isp: 'all',
                osName: EProxyrackOs.All,
            },
            credentialConfigData = fs.readFileSync('packages/connectors/proxyrack/test/src/assets/credentials.json');
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
                ConnectorProxyrackModule,
            ],
            CONNECTOR_PROXYRACK_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
