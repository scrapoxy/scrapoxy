import {
    Proxy,
    sigstop,
} from '@scrapoxy/proxy-sdk';
import { ConfigLoader } from './config-loader';
import { watchFile } from './watch';
import type { IProxyLogger } from '@scrapoxy/proxy-sdk';


class ProxyLoggerConsole implements IProxyLogger {
    log(message: string) {
        console.log(message);
    }

    error(
        message: string, stack?: string
    ) {
        console.error(message);

        if (stack) {
            console.error(stack);
        }
    }

    debug(message: string) {
        console.debug(message);
    }
}


(async() => {
    const logger = new ProxyLoggerConsole();
    let proxy: Proxy | undefined = void 0;
    const watcher = watchFile(
        'config.ini',
        async(filename) => {
            if (proxy) {
                logger.log('Closing previous proxy...');
                try {
                    await proxy.close();
                } catch (err: any) {
                    logger.error(err);
                } finally {
                    proxy = void 0;
                }
            }

            logger.log(`Loading configuration file ${filename}...`);

            const config = new ConfigLoader();
            await config.load(filename);

            proxy = new Proxy(
                logger,
                config.getKeyInt('timeout'),
                config.certificate,
                config.key
            );

            proxy.listen(config.getKeyInt('port'))
                .catch((err: any) => {
                    logger.error(err);
                });
        },
        logger
    );

    watcher.on(
        'close',
        () => {
            if (proxy) {
                proxy.close()
                    .catch((err: any) => {
                        logger.error(err);
                    });
            }
        }
    );

    watcher.on(
        'error',
        (err: any) => {
            logger.error(err);
        }
    );

    sigstop(() => {
        watcher.close();
    });

})()
    .catch((err: any) => {
        console.error(err);
    });
