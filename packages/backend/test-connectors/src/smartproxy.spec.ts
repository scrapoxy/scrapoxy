import * as fs from 'fs';
import { ConnectorSmartproxyModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_SMARTPROXY_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Smartproxy',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/smartproxy/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorSmartproxyModule,
            ],
            CONNECTOR_SMARTPROXY_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on ISP shared',
                            config: {
                                country: 'all',
                                sessionDuration: 10,
                            },
                        },
                    ],
                },
            ]
        );
    }
);
