import * as fs from 'fs';
import { ConnectorGcpModule } from '@scrapoxy/backend-connectors';
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
import type { IConnectorGcpConfig } from '@scrapoxy/backend-connectors';


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
                ConnectorGcpModule,
            ],
            CONNECTOR_GCP_TYPE,
            credentialsConfig
        );
    }
);
