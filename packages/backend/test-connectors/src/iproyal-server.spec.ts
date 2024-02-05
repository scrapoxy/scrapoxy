import * as fs from 'fs';
import {
    ConnectorIproyalServerModule,
    IConnectorIproyalServerConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_IPROYAL_SERVER_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Iproyal Server',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorIproyalServerConfig = {
                product: 'all',
                country: 'all',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/iproyal-server/credentials.json');
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
