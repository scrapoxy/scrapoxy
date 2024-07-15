import { Injectable } from '@nestjs/common';
import { TransportprovidersService } from '@scrapoxy/backend-sdk';
import { ATransportSmartproxyService } from './smartproxy.abstract';
import { TRANSPORT_SMARTPROXY_ENDPOINTS_DC_TYPE } from './smartproxy.constants';


@Injectable()
export class TransportSmartproxyDcService extends ATransportSmartproxyService {
    readonly type = TRANSPORT_SMARTPROXY_ENDPOINTS_DC_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig() {
        // Ignore
    }
}
