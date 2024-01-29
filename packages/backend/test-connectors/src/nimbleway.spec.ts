import * as fs from 'fs';
import {
    Agents,
    ConnectorNimblewayModule,
} from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_NIMBLEWAY_TYPE } from '@scrapoxy/common';
import type { IConnectorNimblewayConfig } from '@scrapoxy/backend-sdk';


describe(
    'Connector Provider - Nimbleway',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorNimblewayConfig = {
                country: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/nimbleway/credentials.json');
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
                ConnectorNimblewayModule,
            ],
            CONNECTOR_NIMBLEWAY_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
