import * as fs from 'fs';
import {
    ConnectorScalewayModule,
    IConnectorScalewayConfig,
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
                            tag: 'spxtest',
                        } satisfies IConnectorScalewayConfig,
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
                ConnectorScalewayModule,
            ],
            CONNECTOR_SCALEWAY_TYPE,
            credentialsConfig
        );
    }
);
