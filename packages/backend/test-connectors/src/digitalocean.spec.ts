import * as fs from 'fs';
import {
    Agents,
    ConnectorDigitaloceanModule,
    DigitalOceanApi,
} from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DIGITALOCEAN_TYPE,
    DIGITALOCEAN_DEFAULT_REGION,
    DIGITALOCEAN_DEFAULT_SIZE,
} from '@scrapoxy/common';
import type { IConnectorDigitalOceanConfig } from '@scrapoxy/backend-sdk';


describe(
    'Connector Provider - DigitalOcean',
    () => {
        const
            agents = new Agents(),
            connectorConfig: IConnectorDigitalOceanConfig = {
                region: DIGITALOCEAN_DEFAULT_REGION,
                port: 3128,
                size: DIGITALOCEAN_DEFAULT_SIZE,
                snapshotId: '',
                tag: 'spxtest',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/digitalocean/credentials.json');
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
                ConnectorDigitaloceanModule,
            ],
            CONNECTOR_DIGITALOCEAN_TYPE,
            credentialConfig,
            connectorConfig,
            {}
        );

        it(
            'should validate the uninstallation',
            async() => {
                const api = new DigitalOceanApi(
                    credentialConfig.token,
                    agents
                );
                const snapshotId = parseInt(connectorConfig.snapshotId);
                await expect(api.getSnapshot(snapshotId))
                    .rejects
                    .toThrow(/could not be found/);
            }
        );
    }
);
