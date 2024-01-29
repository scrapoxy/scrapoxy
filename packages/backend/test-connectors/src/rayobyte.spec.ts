import * as fs from 'fs';
import {
    Agents,
    ConnectorRayobyteModule,
} from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_RAYOBYTE_TYPE } from '@scrapoxy/common';
import type { IConnectorRayobyteConfig } from '@scrapoxy/backend-sdk';


describe(
    'Connector Provider - Rayobyte',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorRayobyteConfig = {
                packageFilter: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/rayobyte/credentials.json');
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
