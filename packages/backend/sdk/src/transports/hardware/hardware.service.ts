import { Injectable } from '@nestjs/common';
import { TRANSPORT_HARDWARE_TYPE } from './hardware.constants';
import { TransportprovidersService } from '../providers.service';
import { ATransportProxyService } from '../proxy';
import type { IConnectorHardwareCredential } from './hardware.interface';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyTransport,
} from '@scrapoxy/common';


@Injectable()
export class TransportHarwareService extends ATransportProxyService {
    readonly type = TRANSPORT_HARDWARE_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const proxyConfig = proxy.config as IProxyTransport;
        const credentialConfig = connector.credentialConfig as IConnectorHardwareCredential;

        proxyConfig.auth = {
            username: credentialConfig.proxyUsername,
            password: credentialConfig.proxyPassword,
        };
    }
}
