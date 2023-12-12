import type { IHttpOptions } from '../helpers';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';


export interface ITransportService {
    type: string;

    completeProxyConfig: (proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh) => void;

    buildRequestArgs: (
        method: string | undefined,
        urlOpts: IHttpOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ) => ClientRequestArgs;

    buildFingerprintRequestArgs: (
        method: string | undefined,
        urlOpts: IHttpOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ) => ClientRequestArgs;

    buildConnectArgs: (
        url: string,
        headers: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ) => ClientRequestArgs;
}
