import { Injectable } from '@nestjs/common';
import { ATransportDatacenterService } from './datacenter.abstract';
import { TRANSPORT_DATACENTER_TYPE } from './datacenter.constants';
import { TransportprovidersService } from '../providers.service';
import type { IProxyToConnectConfigDatacenter } from './datacenter.interface';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


export class TransportDatacenterServiceImpl extends ATransportDatacenterService {
    readonly type = TRANSPORT_DATACENTER_TYPE;

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const proxyConfig = proxy.config as IProxyToConnectConfigDatacenter;

        if (connector.certificate) {
            proxyConfig.certificate = connector.certificate;
        }
    }
}


@Injectable()
export class TransportDatacenterService extends TransportDatacenterServiceImpl {
    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }
}
