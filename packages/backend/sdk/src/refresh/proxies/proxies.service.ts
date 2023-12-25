import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { EFingerprintMode } from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import { REFRESH_PROXIES_CONFIG } from './proxies.constants';
import {
    CommanderRefreshClientService,
    NoProxyToRefreshError,
} from '../../commander-client';
import { ConnectorprovidersService } from '../../connectors';
import { fingerprint } from '../../fingerprint';
import { TransportprovidersService } from '../../transports';
import { ARefresh } from '../refresh.abstract';
import type { IRefreshProxiesModuleConfig } from './proxies.module';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IFingerprintRequest,
    IProxiesToRefresh,
    IProxyRefreshed,
} from '@scrapoxy/common';


@Injectable()
export class RefreshProxiesService extends ARefresh<IProxiesToRefresh> implements OnModuleDestroy {
    protected readonly logger = new Logger(RefreshProxiesService.name);

    private readonly sockets: Sockets | undefined;

    constructor(
        @Inject(REFRESH_PROXIES_CONFIG)
        private readonly config: IRefreshProxiesModuleConfig,
        private readonly connectorproviders: ConnectorprovidersService,
        private readonly commander: CommanderRefreshClientService,
        private readonly transportproviders: TransportprovidersService
    ) {
        super(config);

        this.sockets = config.trackSockets ? new Sockets() : void 0;
    }

    get socketsSize(): number {
        if (!this.sockets) {
            throw new Error('Sockets are not tracked');
        }

        return this.sockets.size;
    }

    async next(): Promise<IProxiesToRefresh | undefined> {
        try {
            const proxies = await this.commander.getNextProxiesToRefresh();

            return proxies;
        } catch (err: any) {
            if (err instanceof NoProxyToRefreshError) {
                return;
            }

            throw err;
        }
    }

    async task(proxiesToRefresh: IProxiesToRefresh): Promise<void> {
        const ids = proxiesToRefresh.proxies.map((p) => p.id);
        this.logger.debug(`fingerprint instances ${ids.join(',')}`);

        // Parallel version
        const sockets = new Sockets(this.sockets);
        let proxiesRefreshed: IProxyRefreshed[];
        try {
            proxiesRefreshed = await Promise.all(proxiesToRefresh.proxies.map((proxy) => {
                const factory = this.connectorproviders.getFactory(proxy.type);
                const transport = this.transportproviders.getTransportByType(factory.config.transportType);
                const payload: IFingerprintRequest = {
                    installId: proxiesToRefresh.installId,
                    mode: EFingerprintMode.CONNECTOR,
                    connectorType: proxy.type,
                    proxyId: proxy.id,
                    bytesReceived: proxy.bytesReceived,
                    bytesSent: proxy.bytesSent,
                    requests: proxy.requests,
                };

                return fingerprint(
                    transport,
                    proxy,
                    this.config.fingerprint,
                    payload,
                    sockets
                )
                    .then((fp) => {
                        const refreshed: IProxyRefreshed = {
                            id: proxy.id,
                            fingerprint: fp,
                            fingerprintError: null,
                        };

                        return refreshed;
                    })
                    .catch((err: any) => {
                        const refreshed: IProxyRefreshed = {
                            id: proxy.id,
                            fingerprint: null,
                            fingerprintError: err.message,
                        };

                        return refreshed;
                    });
            }));
        } finally {
            sockets.closeAll();
        }

        await this.commander.refreshProxies(proxiesRefreshed);
    }

    onModuleDestroy() {
        if (this.sockets) {
            this.sockets.closeAll();
        }
    }
}
