import { Module } from '@nestjs/common';
import { TransportprovidersModule } from '@scrapoxy/backend-sdk';
import { TransportSmartproxyResidentialService } from './smartproxy-residential.service';
import { TransportSmartproxyServerService } from './smartproxy-server.service';


@Module({
    imports: [
        TransportprovidersModule,
    ],
    providers: [
        TransportSmartproxyResidentialService, TransportSmartproxyServerService,
    ],
})
export class TransportSmartproxyModule {}
