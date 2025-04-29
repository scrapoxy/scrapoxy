import { Injectable } from '@nestjs/common';
import { TransportprovidersService } from '@scrapoxy/backend-sdk';
import { ATransportDecodoService } from './decodo.abstract';
import { TRANSPORT_DECODO_ENDPOINTS_DC_TYPE } from './decodo.constants';


@Injectable()
export class TransportDecodoDcService extends ATransportDecodoService {
    readonly type = TRANSPORT_DECODO_ENDPOINTS_DC_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig() {
        // Ignore
    }
}
