import { Injectable } from '@nestjs/common';
import { ATransportCloudService } from './cloud.abstract';
import { TRANSPORT_CLOUD_TYPE } from './cloud.constants';
import { TransportprovidersService } from '../providers.service';
import type { IProxyToConnectConfigCloud } from './cloud.interface';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


export class TransportCloudServiceImpl extends ATransportCloudService {
    readonly type = TRANSPORT_CLOUD_TYPE;

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const proxyConfig = proxy.config as IProxyToConnectConfigCloud;

        if (connector.certificate) {
            proxyConfig.certificate = connector.certificate;
        }
    }
}


@Injectable()
export class TransportCloudService extends TransportCloudServiceImpl {
    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }
}
