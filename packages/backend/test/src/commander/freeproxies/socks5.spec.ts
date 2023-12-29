import { Logger } from '@nestjs/common';
import { ProxySocks } from '@scrapoxy/backend-sdk';
import {
    EProxyType,
    IFreeproxyBase,
    ONE_MINUTE_IN_MS,
} from '@scrapoxy/common';
import { testProxy } from './freeproxies.helpers';


describe(
    'Commander - Freeproxies - SOCKS5',
    () => {
        const logger = new Logger();
        const
            freeproxy: IFreeproxyBase = {
                type: EProxyType.SOCKS5,
                key: 'freeproxyhttps',
                address: {
                    hostname: 'localhost',
                    port: -1,
                },
                auth: null,
            },
            proxy = new ProxySocks(
                logger,
                ONE_MINUTE_IN_MS
            );

        beforeAll(async() => {
            await proxy.listen();

            freeproxy.address.port = proxy.port as number;
        });

        afterAll(async() => {
            await proxy.close();
        });

        testProxy(
            {
                beforeAll, afterAll, it, expect,
            },
            logger,
            freeproxy
        );
    }
);
