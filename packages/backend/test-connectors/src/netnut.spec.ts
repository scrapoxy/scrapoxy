import * as fs from 'fs';
import {
    ConnectorNetnutModule,
    EConnectorNetnutProxyType,
    IConnectorNetnutConfig,
} from '@scrapoxy/backend-connectors';
import { Agents } from '@scrapoxy/backend-sdk';
import { testConnector } from '@scrapoxy/backend-test-sdk';
import { CONNECTOR_NETNUT_TYPE } from '@scrapoxy/common';


describe(
    'Connector Provider - NetNut',
    () => {
        const agents = new Agents();
        const connectorConfig: IConnectorNetnutConfig = {
                proxyType: EConnectorNetnutProxyType.RES,
                country: 'us',
            },
            credentialConfigData = fs.readFileSync('packages/backend/test-connectors/src/assets/netnut/credentials.json');
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
                ConnectorNetnutModule,
            ],
            CONNECTOR_NETNUT_TYPE,
            credentialConfig,
            connectorConfig
        );
    }
);
