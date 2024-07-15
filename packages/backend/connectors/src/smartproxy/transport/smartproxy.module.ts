import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportSmartproxyDcService } from './smartproxy-dc.service';
import { TransportSmartproxyResidentialService } from './smartproxy-residential.service';
import { TransportSmartproxyServerService } from './smartproxy-server.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportSmartproxyDcService, TransportSmartproxyResidentialService, TransportSmartproxyServerService,
    ],
})
export class TransportSmartproxyModule {}
