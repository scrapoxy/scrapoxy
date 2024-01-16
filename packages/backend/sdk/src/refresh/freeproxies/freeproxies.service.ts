import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { EFingerprintMode } from '@scrapoxy/common';
import { CONNECTOR_FREEPROXIES_TYPE } from '@scrapoxy/connector-freeproxies-sdk';
import { Sockets } from '@scrapoxy/proxy-sdk';
import { REFRESH_FREEPROXIES_CONFIG } from './freeproxies.constants';
import { CommanderRefreshClientService } from '../../commander-client';
import { NoFreeproxyToRefreshError } from '../../errors';
import { fingerprint } from '../../fingerprint';
import {
    TRANSPORT_PROXY_TYPE,
    TransportprovidersService,
} from '../../transports';
import { ARefresh } from '../refresh.abstract';
import type { IRefreshFreeproxiesModuleConfig } from './freeproxies.module';
import type {
    IFingerprintRequest,
    IFreeproxiesToRefresh,
    IFreeproxyRefreshed,
    IProxyToConnect,
    IProxyTransport,
} from '@scrapoxy/common';


@Injectable()
export class RefreshFreeproxiesService extends ARefresh<IFreeproxiesToRefresh> {
    protected readonly logger = new Logger(RefreshFreeproxiesService.name);

    constructor(
        @Inject(REFRESH_FREEPROXIES_CONFIG)
        private readonly config: IRefreshFreeproxiesModuleConfig,
        private readonly commander: CommanderRefreshClientService,
        private readonly provider: TransportprovidersService
    ) {
        super(config);
    }

    async next(): Promise<IFreeproxiesToRefresh | undefined> {
        try {
            const freeproxies = await this.commander.getNextFreeproxiesToRefresh();

            return freeproxies;
        } catch (err: any) {
            if (err instanceof NoFreeproxyToRefreshError) {
                return;
            }

            throw err;
        }
    }

    async task(freeproxieToRefresh: IFreeproxiesToRefresh): Promise<void> {
        const ids = freeproxieToRefresh.freeproxies.map((p) => p.id);
        this.logger.debug(`fingerprint free proxies ${ids.join(',')}`);

        const transport = this.provider.getTransportByType(TRANSPORT_PROXY_TYPE);
        const sockets = new Sockets();
        let freeproxiesRefreshed: IFreeproxyRefreshed[];
        try {
            freeproxiesRefreshed = await Promise.all(freeproxieToRefresh.freeproxies.map((freeproxy) => {
                const payload: IFingerprintRequest = {
                    installId: freeproxieToRefresh.installId,
                    mode: EFingerprintMode.FREEPROXIES,
                    connectorType: CONNECTOR_FREEPROXIES_TYPE,
                    proxyId: freeproxy.id,
                    bytesReceived: 0,
                    bytesSent: 0,
                    requests: 0,
                };
                const config: IProxyTransport = {
                    type: freeproxy.type,
                    address: freeproxy.address,
                    auth: freeproxy.auth,
                };
                const proxy: IProxyToConnect = {
                    id: freeproxy.id,
                    projectId: freeproxy.projectId,
                    connectorId: freeproxy.connectorId,
                    type: CONNECTOR_FREEPROXIES_TYPE,
                    config,
                    key: freeproxy.key,
                    useragent: 'not_used',
                };

                return fingerprint(
                    transport,
                    proxy,
                    this.config.fingerprint,
                    payload,
                    sockets
                )
                    .then((fp) => {
                        const refreshed: IFreeproxyRefreshed = {
                            id: freeproxy.id,
                            connectorId: freeproxy.connectorId,
                            projectId: freeproxy.projectId,
                            fingerprint: fp,
                            fingerprintError: null,
                        };

                        return refreshed;
                    })
                    .catch((err: any) => {
                        const refreshed: IFreeproxyRefreshed = {
                            id: freeproxy.id,
                            connectorId: freeproxy.connectorId,
                            projectId: freeproxy.projectId,
                            fingerprint: null,
                            fingerprintError: err.message,
                        };

                        return refreshed;
                    });
            }));
        } finally {
            sockets.closeAll();
        }

        await this.commander.updateFreeproxies(freeproxiesRefreshed);
    }
}
