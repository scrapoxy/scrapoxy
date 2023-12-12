import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorRayobyteModule } from '@scrapoxy/connector-rayobyte-backend';
import { CONNECTOR_RAYOBYTE_TYPE } from '@scrapoxy/connector-rayobyte-sdk';
import type { IConnectorRayobyteConfig } from '@scrapoxy/connector-rayobyte-backend';


describe(
    'Connector Provider - Rayobyte',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorRayobyteConfig = {
                packageFilter: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/connectors/rayobyte/test/src/assets/credentials.json');
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
                ConnectorRayobyteModule,
            ],
            CONNECTOR_RAYOBYTE_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
