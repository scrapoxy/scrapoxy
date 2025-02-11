import * as fs from 'fs';
import {
    ConnectorTencentModule,
    IConnectorTencentConfig,
    TencentApi,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    ITestCredential,
    testConnectors,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_TENCENT_TYPE,
    TENCENT_DEFAULT_INSTANCE_TYPE,
    TENCENT_DEFAULT_REGION,
    TENCENT_DEFAULT_ZONE,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Tencent',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/tencent/credentials.json');
        const credentialsConfig: ITestCredential[] = [
            {
                name: 'Unique Credential',
                config: JSON.parse(credentialConfigData.toString()),
                connectors: [
                    {
                        name: `Test on region ${TENCENT_DEFAULT_REGION} with instance type ${TENCENT_DEFAULT_INSTANCE_TYPE}`,
                        config: {
                            region: TENCENT_DEFAULT_REGION,
                            zone: TENCENT_DEFAULT_ZONE,
                            port: 3128,
                            instanceType: TENCENT_DEFAULT_INSTANCE_TYPE,
                            imageId: '',
                            tag: 'spxtest',
                            projectId: '',
                        } satisfies IConnectorTencentConfig,
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
                ConnectorTencentModule,
            ],
            CONNECTOR_TENCENT_TYPE,
            credentialsConfig
        );

        it(
            'should validate the uninstallations',
            async() => {
                for (const credentialTest of credentialsConfig) {
                    const api = new TencentApi(
                        credentialTest.config.secretId,
                        credentialTest.config.secretKey,
                        TENCENT_DEFAULT_REGION,
                        // credentialTest.config.projectId,
                        agents
                    );
                        // Instances
                    const instances = await api.describeInstances();
                    expect(instances)
                        .toHaveLength(0);

                    // Images
                    const images = await api.describeImages({
                        imageType: 'PRIVATE_IMAGE',
                    });
                    expect(images)
                        .toHaveLength(0);
                }
            }
        );
    }
);
