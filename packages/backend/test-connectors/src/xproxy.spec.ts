import * as fs from 'fs';
import { ConnectorXProxyModule } from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_XPROXY_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - XProxy',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/xproxy/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorXProxyModule,
            ],
            CONNECTOR_XPROXY_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on hardware',
                            config: void 0,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
