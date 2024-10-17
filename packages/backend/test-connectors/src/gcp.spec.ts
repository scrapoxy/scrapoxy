import * as fs from 'fs';
import {
    ConnectorGcpModule,
    GcpApi,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    ITestCredential,
    testConnectors,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_GCP_TYPE,
    GCP_DEFAULT_MACHINE_TYPE,
    GCP_DEFAULT_ZONE,
} from '@scrapoxy/common';
import type {
    IConnectorGcpConfig,
    IConnectorGcpInstallConfig,
} from '@scrapoxy/backend-connectors';


describe(
    'Connector Provider - Google Cloud Platform',
    () => {
        const
            agents = new Agents(),
            suffix = Math.floor(Math.random() * 1000000000)
                .toString(10);
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/gcp/credentials.json');
        const credentialsConfig: ITestCredential[] = [
            {
                name: 'Unique Credential',
                config: JSON.parse(credentialConfigData.toString()),
                connectors: [
                    {
                        name: `Test on zone ${GCP_DEFAULT_ZONE} with machine type ${GCP_DEFAULT_MACHINE_TYPE}`,
                        config: {
                            zone: GCP_DEFAULT_ZONE,
                            port: 3128,
                            machineType: GCP_DEFAULT_MACHINE_TYPE,
                            templateName: `spxtest-template-${suffix}`,
                            networkName: 'default',
                            label: 'spxtest',
                            firewallName: `spxtest-proxy-fw-${suffix}`,
                        } satisfies IConnectorGcpConfig,
                        install: {
                            diskType: 'pd-standard',
                            diskSize: 10,
                        } satisfies IConnectorGcpInstallConfig,
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
                ConnectorGcpModule,
            ],
            CONNECTOR_GCP_TYPE,
            credentialsConfig
        );

        it(
            'should validate the uninstallation',
            async() => {
                for (const credentialTest of credentialsConfig) {
                    const api = new GcpApi(
                        credentialTest.config.projectId,
                        credentialTest.config.clientEmail,
                        credentialTest.config.privateKeyId,
                        credentialTest.config.privateKey,
                        agents
                    );

                    for (const connectorTest of credentialTest.connectors) {
                        await expect(api.getInstance(
                            connectorTest.config.zone,
                            `${connectorTest.config.templateName}-instance`
                        ))
                            .rejects
                            .toThrow(/was not found/);

                        await expect(api.getImage(`${connectorTest.config.templateName}-image`))
                            .rejects
                            .toThrow(/was not found/);

                        await expect(api.getTemplate(connectorTest.config.templateName))
                            .rejects
                            .toThrow(/was not found/);

                        await expect(api.getFirewall(connectorTest.config.firewallName))
                            .rejects
                            .toThrow(/was not found/);
                    }
                }
            }
        );
    }
);
