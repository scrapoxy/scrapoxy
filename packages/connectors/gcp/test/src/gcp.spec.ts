import * as fs from 'fs';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import {
    ConnectorGcpModule,
    GcpApi,
} from '@scrapoxy/connector-gcp-backend';
import {
    CONNECTOR_GCP_TYPE,
    GCP_DEFAULT_MACHINE_TYPE,
    GCP_DEFAULT_ZONE,
} from '@scrapoxy/connector-gcp-sdk';
import type {
    IConnectorGcpConfig,
    IConnectorGcpInstallConfig,
} from '@scrapoxy/connector-gcp-backend';


describe(
    'Connector Provider - Google Cloud Platform',
    () => {
        const
            agents = new Agents(),
            suffix = Math.floor(Math.random() * 1000000000)
                .toString(10);
        const
            connectorConfig: IConnectorGcpConfig = {
                zone: GCP_DEFAULT_ZONE,
                port: 3128,
                machineType: GCP_DEFAULT_MACHINE_TYPE,
                templateName: `spxtest-template-${suffix}`,
                networkName: 'default',
                label: 'spxtest',
                firewallName: `spxtest-proxy-fw-${suffix}`,
            },
            credentialConfigData = fs.readFileSync('packages/connectors/gcp/test/src/assets/credentials.json'),
            installConfig: IConnectorGcpInstallConfig = {
                diskType: 'pd-standard',
                diskSize: 10,
            };
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
                ConnectorGcpModule,
            ],
            CONNECTOR_GCP_TYPE,
            credentialConfig,
            connectorConfig,
            installConfig
        );

        it(
            'should validate the uninstallation',
            async() => {
                const api = new GcpApi(
                    credentialConfig.projectId,
                    credentialConfig.clientEmail,
                    credentialConfig.privateKeyId,
                    credentialConfig.privateKey,
                    agents
                );

                await expect(api.getInstance(
                    connectorConfig.zone,
                    `${connectorConfig.templateName}-instance`
                ))
                    .rejects
                    .toThrow(/was not found/);

                await expect(api.getImage(`${connectorConfig.templateName}-image`))
                    .rejects
                    .toThrow(/was not found/);

                await expect(api.getTemplate(connectorConfig.templateName))
                    .rejects
                    .toThrow(/was not found/);

                await expect(api.getFirewall(connectorConfig.firewallName))
                    .rejects
                    .toThrow(/was not found/);
            }
        );
    }
);
