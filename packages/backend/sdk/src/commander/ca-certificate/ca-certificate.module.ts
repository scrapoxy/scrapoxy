import { Module } from '@nestjs/common';
import { CommanderCaCertificateController } from './ca-certificate.controller';


@Module({
    controllers: [
        CommanderCaCertificateController,
    ],
})
export class CommanderCaCertificateModule { }
