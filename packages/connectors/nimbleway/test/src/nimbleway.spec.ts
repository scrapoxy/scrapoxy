import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorNimblewayModule } from '@scrapoxy/connector-nimbleway-backend';
import { CONNECTOR_NIMBLEWAY_TYPE } from '@scrapoxy/connector-nimbleway-sdk';
import type { IConnectorNimblewayConfig } from '@scrapoxy/connector-nimbleway-backend';


describe(
    'Connector Provider - Nimbleway',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorNimblewayConfig = {
                country: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/connectors/nimbleway/test/src/assets/credentials.json');
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
