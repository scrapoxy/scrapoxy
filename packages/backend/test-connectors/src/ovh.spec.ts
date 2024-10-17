import * as fs from 'fs';
import {
    ConnectorOvhModule,
    OvhApi,
} from '@scrapoxy/backend-connectors';
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

        it(
            'should validate the uninstallation',
            async() => {
                for (const credentialTest of credentialsConfig) {
                    const api = new OvhApi(
                        credentialTest.config.appKey,
                        credentialTest.config.appSecret,
                        credentialTest.config.consumerKey,
                        agents
                    );

                    for (const connectorTest of credentialTest.connectors) {
                        const snapshots = await api.getAllSnapshots(
                            connectorTest.config.projectId,
                            connectorTest.config.region
                        );
                        expect(snapshots)
                            .toHaveLength(0);
                    }
                }
            }
        );
    }
);
