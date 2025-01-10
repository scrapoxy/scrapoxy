import * as fs from 'fs';
import {
    ConnectorScalewayModule,
    IConnectorScalewayConfig,
    ScalewayApi,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    ITestCredential,
    testConnectors,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_SCALEWAY_TYPE,
    SCALEWAY_DEFAULT_INSTANCE_TYPE,
    SCALEWAY_DEFAULT_REGION,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Scaleway',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/scaleway/credentials.json');
        const credentialsConfig: ITestCredential[] = [
            {
                name: 'Unique Credential',
                config: JSON.parse(credentialConfigData.toString()),
                connectors: [
                    {
                        name: `Test on region ${SCALEWAY_DEFAULT_REGION} with instance type ${SCALEWAY_DEFAULT_INSTANCE_TYPE}`,
                        config: {
                            region: SCALEWAY_DEFAULT_REGION,
                            port: 3128,
                            instanceType: SCALEWAY_DEFAULT_INSTANCE_TYPE,
                            snapshotId: '',
                            imageId: '',
                            tag: 'spxtest',
                        } satisfies IConnectorScalewayConfig,
                        install: {},
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
                ConnectorScalewayModule,
            ],
            CONNECTOR_SCALEWAY_TYPE,
            credentialsConfig
        );

        it(
            'should validate the uninstallations',
            async() => {
                for (const credentialTest of credentialsConfig) {
                    const api = new ScalewayApi(
                        credentialTest.config.secretAccessKey,
                        SCALEWAY_DEFAULT_REGION,
                        credentialTest.config.projectId,
                        agents
                    );
                        // Instances
                    const instances = await api.listInstances();
                    expect(instances)
                        .toHaveLength(0);

                    // Volumes
                    const volumes = await api.listVolumes();
                    expect(volumes)
                        .toHaveLength(0);

                    // Images
                    const images = await api.listImages();
                    expect(images)
                        .toHaveLength(0);

                    // Snapshots
                    const snapshots = await api.listSnapshots();
                    expect(snapshots)
                        .toHaveLength(0);
                }
            }
        );
    }
);
