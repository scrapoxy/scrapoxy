import { ATransportResidentialService } from '@scrapoxy/backend-sdk';
import type {
    ArrayHttpHeaders,
    IUrlOptions,
} from '@scrapoxy/backend-sdk';
import type {
    IFingerprint,
    IFingerprintResponseRaw,
    IProxyToRefresh,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    IncomingMessage,
    OutgoingHttpHeaders,
} from 'http';


export abstract class ATransportBrightdataService extends ATransportResidentialService {
    override buildFingerprintRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToRefresh,
        sockets: ISockets
    ): ClientRequestArgs {
        headers.setOrUpdateFirstHeader(
            'Host',
            'geo.brdtest.com:443'
        );
        headersConnect.Host = 'geo.brdtest.com:443';

        urlOpts.hostname = 'geo.brdtest.com';
        urlOpts.pathname = '/mygeo.json';

        return super.buildRequestArgs(
            method,
            urlOpts,
            headers,
            headersConnect,
            proxy,
            sockets
        );
    }

    override parseFingerprintResponse(response: IFingerprintResponseRaw): IFingerprint {
        const body = JSON.parse(response.body);
        const fp: IFingerprint = {
            ip: 'hidden',
            useragent: null,
            asnName: body.asn?.org_name ?? null,
            asnNetwork: null,
            continentCode: body.geo?.region ?? null,
            continentName: body.geo?.region_name ?? null,
            countryCode: body.country ?? null,
            countryName: null,
            cityName: body.geo?.city ?? null,
            timezone: body.geo?.tz ?? null,
            latitude: body.geo?.latitude ?? null,
            longitude: body.geo?.longitude ?? null,
        };

        return fp;
    }

    protected override parseBodyError(
        r: IncomingMessage, callback: (err: Error) => void
    ) {
        for (const headerName of [
            'x-brd-error', 'x-luminati-error',
        ]) {
            const error = r.headers[ headerName ] as string;

            if (error && error.length > 0) {
                callback(new Error(error));

                return;
            }
        }

        super.parseBodyError(
            r,
            callback
        );
    }
}
