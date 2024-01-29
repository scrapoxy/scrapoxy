import * as fs from 'fs';
import {
    Agents,
    ConnectorZyteModule,
} from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_ZYTE_TYPE } from '@scrapoxy/common';
import type { IConnectorZyteConfig } from '@scrapoxy/backend-sdk';


describe(
    'Connector Provider - Zyte',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorZyteConfig = {
                region: 'fr',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/zyte/credentials.json');
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
                ConnectorZyteModule,
            ],
            CONNECTOR_ZYTE_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
