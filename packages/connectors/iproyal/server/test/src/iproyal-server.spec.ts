import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    ConnectorIproyalServerModule,
    IConnectorIproyalServerConfig,
} from '@scrapoxy/connector-iproyal-server-backend';
import { CONNECTOR_IPROYAL_SERVER_TYPE } from '@scrapoxy/connector-iproyal-server-sdk';


describe(
    'Connector Provider - Iproyal Server',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorIproyalServerConfig = {
                product: 'all',
                country: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/connectors/iproyal/server/test/src/assets/credentials.json');
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
                ConnectorIproyalServerModule,
            ],
            CONNECTOR_IPROYAL_SERVER_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
