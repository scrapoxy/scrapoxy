import * as fs from 'fs';
import {
    Agents,
    ConnectorIproyalResidentialModule,
    IConnectorIproyalResidentialConfig,
} from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_IPROYAL_RESIDENTIAL_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Iproyal Residential',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorIproyalResidentialConfig = {
                lifetime: '24h',
                country: 'all',
                state: 'all',
                city: 'all',
                highEndPool: false,
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/iproyal-residential/credentials.json');
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
                ConnectorIproyalResidentialModule,
            ],
            CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
