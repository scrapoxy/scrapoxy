import * as fs from 'fs';
import {
    Agents,
    ConnectorOvhModule,
    OvhApi,
} from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/common';
import type {
    IConnectorOvhConfig,
    IConnectorOvhCredential,
} from '@scrapoxy/backend-sdk';


describe(
    'Connector Provider - OVH Cloud',
    () => {
        const
            agents = new Agents(),
            connectorConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/ovh/config.json'),
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/ovh/credentials.json');
        const
            connectorConfig = JSON.parse(connectorConfigData.toString()) as IConnectorOvhConfig,
            credentialConfig = JSON.parse(credentialConfigData.toString()) as IConnectorOvhCredential;

        afterAll(() => {
            agents.close();
        });

        testConnector(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorOvhModule,
            ],
            CONNECTOR_OVH_TYPE,
            credentialConfig,
            connectorConfig,
            {}
        );

        it(
            'should validate the uninstallation',
            async() => {
                const api = new OvhApi(
                    credentialConfig.appKey,
                    credentialConfig.appSecret,
                    credentialConfig.consumerKey,
                    agents
                );
                const snapshots = await api.getAllSnapshots(
                    connectorConfig.projectId,
                    connectorConfig.region
                );
                expect(snapshots)
                    .toHaveLength(0);
            }
        );
    }
);
