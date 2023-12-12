import {
    Controller,
    Get,
    Header,
} from '@nestjs/common';
import { readCaCert } from './ca-certificate.helpers';
import type { OnModuleInit } from '@nestjs/common';


@Controller('api/certificate/ca')
export class CommanderCaCertificateController implements OnModuleInit {
    private cert!: string;

    //////////// CA CERTIFICATE ////////////
    @Get()
    @Header(
        'Content-Disposition',
        'attachment; filename="scrapoxy-ca.crt"'
    )
    async getCaCertificate(): Promise<string> {
        return this.cert;
    }

    async onModuleInit(): Promise<void> {
        this.cert = await readCaCert();
    }
}
