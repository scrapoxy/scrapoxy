import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    ConnectorOvhModule,
    OvhApi,
} from '@scrapoxy/connector-ovh-backend';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/connector-ovh-sdk';
import type {
    IConnectorOvhConfig,
    IConnectorOvhCredential,
} from '@scrapoxy/connector-ovh-backend';


describe(
    'Connector Provider - OVH Cloud',
    () => {
        const
            agents = new Agents(),
            connectorConfigData = fs.readFileSync('packages/connectors/ovh/test/src/assets/config.json'),
            credentialConfigData = fs.readFileSync('packages/connectors/ovh/test/src/assets/credentials.json');
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
