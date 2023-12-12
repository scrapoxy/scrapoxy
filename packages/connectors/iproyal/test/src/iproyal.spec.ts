import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { ConnectorIproyalModule } from '@scrapoxy/connector-iproyal-backend';
import { CONNECTOR_IPROYAL_TYPE } from '@scrapoxy/connector-iproyal-sdk';
import type { IConnectorIproyalConfig } from '@scrapoxy/connector-iproyal-backend';


describe(
    'Connector Provider - Iproyal',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorIproyalConfig = {
                product: 'all',
                country: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/connectors/iproyal/test/src/assets/credentials.json');
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
                ConnectorIproyalModule,
            ],
            CONNECTOR_IPROYAL_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
