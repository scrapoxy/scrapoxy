import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorZyteModule } from '@scrapoxy/connector-zyte-backend';
import { CONNECTOR_ZYTE_TYPE } from '@scrapoxy/connector-zyte-sdk';
import type { IConnectorZyteConfig } from '@scrapoxy/connector-zyte-backend';


describe(
    'Connector Provider - Zyte',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorZyteConfig = {
                region: 'fr',
            },
            credentialConfigData = fs.readFileSync('packages/connectors/zyte/test/src/assets/credentials.json');
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
