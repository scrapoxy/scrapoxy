import * as fs from 'fs';
import { ConnectorOvhModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    ITestCredential,
    testConnectors,
} from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/common';
import type { IConnectorOvhConfig } from '@scrapoxy/backend-connectors';


describe(
    'Connector Provider - OVH Cloud',
    () => {
        const
            agents = new Agents(),
            connectorConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/ovh/config.json'),
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/ovh/credentials.json');
        const connectorConfig = JSON.parse(connectorConfigData.toString()) as IConnectorOvhConfig;
        const credentialsConfig: ITestCredential[] = [
            {
                name: 'Unique Credential',
                config: JSON.parse(credentialConfigData.toString()),
                connectors: [
                    {
                        name: `Test on region ${connectorConfig.region}`,
                        config: connectorConfig,
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
                ConnectorOvhModule,
            ],
            CONNECTOR_OVH_TYPE,
            credentialsConfig
        );
    }
);
