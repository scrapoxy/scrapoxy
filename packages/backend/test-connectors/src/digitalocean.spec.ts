import * as fs from 'fs';
import {
    ConnectorDigitaloceanModule,
    IConnectorDigitalOceanConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    ITestCredential,
    testConnectors,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DIGITALOCEAN_TYPE,
    DIGITALOCEAN_DEFAULT_REGION,
    DIGITALOCEAN_DEFAULT_SIZE,
} from '@scrapoxy/common';


describe(
    'Connector Provider - DigitalOcean',
    () => {
        const
            agents = new Agents(),
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/digitalocean/credentials.json');
        const credentialsConfig: ITestCredential[] = [
            {
                name: 'Unique Credential',
                config: JSON.parse(credentialConfigData.toString()),
                connectors: [
                    {
                        name: `Test on region ${DIGITALOCEAN_DEFAULT_REGION} with droplet size ${DIGITALOCEAN_DEFAULT_SIZE}`,
                        config: {
                            region: DIGITALOCEAN_DEFAULT_REGION,
                            port: 3128,
                            size: DIGITALOCEAN_DEFAULT_SIZE,
                            tag: 'spxtest',
                        } satisfies IConnectorDigitalOceanConfig,
                        install: void 0,
                    },
                ],
            },
        ];

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorDigitaloceanModule,
            ],
            CONNECTOR_DIGITALOCEAN_TYPE,
            credentialsConfig
        );
    }
);
