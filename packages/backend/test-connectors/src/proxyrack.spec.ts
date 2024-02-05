import * as fs from 'fs';
import {
    ConnectorProxyrackModule,
    EProxyrackOs,
    IConnectorProxyrackConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_PROXYRACK_TYPE } from '@scrapoxy/common';


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
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/proxyrack/credentials.json');
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
