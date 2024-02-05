import * as fs from 'fs';
import {
    AwsApi,
    ConnectorAwsModule,
    IConnectorAwsConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
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
        const
            connectorConfig: IConnectorAwsConfig = {
                region: AWS_DEFAULT_REGION,
                port: 3128,
                instanceType: AWS_DEFAULT_INSTANCE_TYPE,
                imageId: '',
                securityGroupName: `${SCRAPOXY_DATACENTER_PREFIX}-test-${suffix}`,
                tag: 'spxtest',

            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/aws/credentials.json');
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
                ConnectorAwsModule,
            ],
            CONNECTOR_AWS_TYPE,
            credentialConfig,
            connectorConfig,
            {}
        );

        it(
            'should validate the uninstallation',
            async() => {
                const api = new AwsApi(
                    credentialConfig.accessKeyId,
                    credentialConfig.secretAccessKey,
                    connectorConfig.region,
                    agents
                );
                const securityGroupExists = await api.hasSecurityGroup(connectorConfig.securityGroupName);
                expect(securityGroupExists)
                    .toBeFalsy();

                const image = await api.describeImage(connectorConfig.imageId);
                expect(image)
                    .toBeUndefined();
            }
        );
    }
);
