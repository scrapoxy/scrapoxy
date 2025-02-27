import * as fs from 'fs';
import {
    ConnectorAwsModule,
    IConnectorAwsConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    ITestCredential,
    testConnectors,
} from '@scrapoxy/backend-test-sdk';
import {
    AWS_DEFAULT_INSTANCE_TYPE,
    AWS_DEFAULT_REGION,
    CONNECTOR_AWS_TYPE,
    SCRAPOXY_DATACENTER_PREFIX,
} from '@scrapoxy/common';


describe(
    'Connector Provider - AWS',
    () => {
        const
            agents = new Agents(),
            suffix = Math.floor(Math.random() * 1000000000)
                .toString(10);
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/aws/credentials.json');
        const credentialsConfig: ITestCredential[] = [
            {
                name: 'Unique Credential',
                config: JSON.parse(credentialConfigData.toString()),
                connectors: [
                    {
                        name: `Test on region ${AWS_DEFAULT_REGION} with instance type ${AWS_DEFAULT_INSTANCE_TYPE}`,
                        config: {
                            region: AWS_DEFAULT_REGION,
                            port: 3128,
                            instanceType: AWS_DEFAULT_INSTANCE_TYPE,
                            securityGroupName: `${SCRAPOXY_DATACENTER_PREFIX}-test-${suffix}`,
                            tag: 'spxtest',
                        } satisfies IConnectorAwsConfig,
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
                ConnectorAwsModule,
            ],
            CONNECTOR_AWS_TYPE,
            credentialsConfig
        );
    }
);
