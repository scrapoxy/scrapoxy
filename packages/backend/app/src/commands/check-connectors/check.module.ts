import { Module } from '@nestjs/common';
import { ConnectorprovidersModule } from '@scrapoxy/backend-sdk';
import { ConnectorAwsModule } from '@scrapoxy/connector-aws-backend';
import { ConnectorAzureModule } from '@scrapoxy/connector-azure-backend';
import { ConnectorDigitaloceanModule } from '@scrapoxy/connector-digitalocean-backend';
import { ConnectorFreeproxiesModule } from '@scrapoxy/connector-freeproxies-backend';
import { ConnectorGcpModule } from '@scrapoxy/connector-gcp-backend';
import { ConnectorOvhModule } from '@scrapoxy/connector-ovh-backend';
import { ConnectorZyteModule } from '@scrapoxy/connector-zyte-backend';
import { CHECK_CONNECTORS_MODULE_CONFIG } from './check.constants';
import { CheckConnectorsService } from './check.service';
import type { DynamicModule } from '@nestjs/common';


interface IStorageFile {
    filename: string;
}


interface IEmail {
    sender: string;
    recipients: string[];
    smtp: string;
}


export interface ICheckConnectorsModuleConfig {
    storage: {
        file: IStorageFile;
    };

    output: {
        email: IEmail;
    };
}


function getConfig(): ICheckConnectorsModuleConfig {
    const outputEmailSender = process.env.OUTPUT_EMAIL_SENDER;

    if (!outputEmailSender) {
        throw new Error('OUTPUT_EMAIL_SENDER is not set');
    }

    const outputEmailRecipients = process.env.OUTPUT_EMAIL_RECIPIENTS;

    if (!outputEmailRecipients) {
        throw new Error('OUTPUT_EMAIL_RECIPIENTS is not set');
    }

    const outputEmailSmtp = process.env.OUTPUT_EMAIL_SMTP;

    if (!outputEmailSmtp) {
        throw new Error('OUTPUT_EMAIL_SMTP is not set');
    }

    return {
        storage: {
            file: {
                filename: process.env.STORAGE_FILE_FILENAME ?? 'scrapoxy-check.json',
            },
        },

        output: {
            email: {
                sender: outputEmailSender,
                recipients: outputEmailRecipients.split(','),
                smtp: outputEmailSmtp,
            },
        },
    };
}


@Module({})
export class CheckConnectorsModule {
    static forRoot(): DynamicModule {
        const config = getConfig();

        return {
            module: CheckConnectorsModule,
            imports: [
                ConnectorprovidersModule,
                ConnectorAwsModule,
                ConnectorAzureModule,
                ConnectorDigitaloceanModule,
                ConnectorFreeproxiesModule,
                ConnectorGcpModule,
                ConnectorOvhModule,
                ConnectorZyteModule,
            ],
            providers: [
                CheckConnectorsService,
                {
                    provide: CHECK_CONNECTORS_MODULE_CONFIG,
                    useValue: config,
                },
            ],
        };
    }
}
