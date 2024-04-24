import * as fs from 'fs';
import {
    ConnectorBrightdataModule,
    EBrightdataProductType,
    IConnectorBrightdataConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_BRIGHTDATA_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Brightdata',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorBrightdataConfig = {
                zoneName: 'isp_shared',
                zoneType: EBrightdataProductType.RESIDENTIAL,
                country: 'us',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/brightdata/credentials.json');
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
                ConnectorBrightdataModule,
            ],
            CONNECTOR_BRIGHTDATA_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
