import * as fs from 'fs';
import {
    ConnectorEvomiModule,
    IConnectorEvomiConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnectors } from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_EVOMI_TYPE,
    EEvomiProduct,
} from '@scrapoxy/common';


describe(
    'Connector Provider - Evomi',
    () => {
        const agents = new Agents();
        const credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/evomi/credentials.json');

        afterAll(() => {
            agents.close();
        });

        testConnectors(
            {
                beforeAll, afterAll, it, expect,
            },
            agents,
            [
                ConnectorEvomiModule,
            ],
            CONNECTOR_EVOMI_TYPE,
            [
                {
                    name: 'Unique Credential',
                    config: JSON.parse(credentialConfigData.toString()),
                    connectors: [
                        {
                            name: 'Test on static',
                            config: {
                                product: EEvomiProduct.StaticResidential,
                                hostname: null,
                                port: 0,
                                username: null,
                                password: null,
                                country: 'all',
                            } satisfies IConnectorEvomiConfig,
                            install: void 0,
                        },
                    ],
                },
            ]
        );
    }
);
