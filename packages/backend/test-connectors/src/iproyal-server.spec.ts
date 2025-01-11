import * as fs from 'fs';
import {
    ConnectorIproyalServerModule,
    IConnectorIproyalServerConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_IPROYAL_SERVER_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - Iproyal Server',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/iproyal-server/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorIproyalServerModule,
            ],
            CONNECTOR_IPROYAL_SERVER_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on Static IP',
                            config: {
                                product: 'all',
                                country: 'all',
                            } satisfies IConnectorIproyalServerConfig,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
