import * as fs from 'fs';
import {
    ConnectorAzureModule,
    IConnectorAzureConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    ITestCredential,
    testConnectors,
} from '@scrapoxy/backend-test-sdk';
import {
    AZURE_DEFAULT_LOCATION,
    AZURE_DEFAULT_STORAGE_ACCOUNT_TYPE,
    AZURE_DEFAULT_VM_SIZE,
    CONNECTOR_AZURE_TYPE,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Azure',
    () => {
        const
            agents = new Agents(),
            suffix = Math.floor(Math.random() * 1000000000)
                .toString(10);
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/azure/credentials.json');
        const credentialsConfig: ITestCredential[] = [
            {
                name: 'Unique Credential',
                config: JSON.parse(credentialConfigData.toString()),
                connectors: [
                    {
                        name: `Test on location ${AZURE_DEFAULT_LOCATION} with vm size ${AZURE_DEFAULT_VM_SIZE}`,
                        config: {
                            location: AZURE_DEFAULT_LOCATION,
                            port: 3128,
                            resourceGroupName: `spxtest_${suffix}_rg`,
                            vmSize: AZURE_DEFAULT_VM_SIZE,
                            storageAccountType: AZURE_DEFAULT_STORAGE_ACCOUNT_TYPE,
                            prefix: `spxtest${suffix}`,
                            useSpotInstances: false,
                        } satisfies IConnectorAzureConfig,
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
                ConnectorAzureModule,
            ],
            CONNECTOR_AZURE_TYPE,
            credentialsConfig
        );
    }
);
