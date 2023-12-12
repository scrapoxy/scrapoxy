import { promises as fs } from 'fs';
import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    ConnectorprovidersService,
    validate,
} from '@scrapoxy/backend-sdk';
import { createTransport } from 'nodemailer';
import { CHECK_CONNECTORS_MODULE_CONFIG } from './check.constants';
import { schema } from './check.validation';
import {
    EmailMessageBuilder,
    TextMessageBuilder,
} from './message';
import type {
    ICheckConnectorRequest,
    ICheckConnectorResponse,
} from './check.interface';
import type { ICheckConnectorsModuleConfig } from './check.module';
import type { SendMailOptions } from 'nodemailer';


@Injectable()
export class CheckConnectorsService {
    private readonly logger = new Logger(CheckConnectorsService.name);

    constructor(
        @Inject(CHECK_CONNECTORS_MODULE_CONFIG)
        private readonly config: ICheckConnectorsModuleConfig,
        private readonly providers: ConnectorprovidersService
    ) {}

    async run() {
        const configRaw = await fs.readFile(this.config.storage.file.filename);
        const requests = JSON.parse(configRaw.toString()) as ICheckConnectorRequest[];

        // Validate schema
        await validate(
            schema,
            requests
        );

        // Sort requests by type
        const requestsByType = new Map<string, ICheckConnectorRequest[]>();
        for (const req of requests) {
            let reqs = requestsByType.get(req.type);

            if (reqs) {
                reqs.push(req);
            } else {
                reqs = [
                    req,
                ];
                requestsByType.set(
                    req.type,
                    reqs
                );
            }
        }

        // Start checks in parallel but sequentially for each request type,
        // to avoid too many requests on a connector provider
        const emailBuilder = new EmailMessageBuilder();
        const promises = Array.from(requestsByType.values())
            .map((r) => {
                return (async(reqs) => {
                    for (const request of reqs) {
                        this.logger.debug(`Checking connector ${request.name}...`);

                        let response: ICheckConnectorResponse;
                        try {
                            const connectorCheck = this.providers.getFactory(request.type);
                            const list = await connectorCheck.listAllProxies(request.credential);
                            response = {
                                type: request.type,
                                name: request.name,
                                maxProxies: request.maxProxies,
                                ...list,
                            };
                        } catch (err: any) {
                            response = {
                                type: request.type,
                                name: request.name,
                                maxProxies: request.maxProxies,
                                proxies: [],
                                errors: [
                                    err.message,
                                ],
                            };
                        }

                        if (response.proxies.length > response.maxProxies || response.errors.length > 0) {
                            const textBuilder = new TextMessageBuilder();
                            textBuilder.addResponse(response);

                            const text = textBuilder.toString();
                            this.logger.debug(text);

                            emailBuilder.addResponse(response);
                        } else {
                            this.logger.debug(`No issue found for connector ${response.name}`);
                        }
                    }
                })(r);
            });

        await Promise.all(promises);

        if (emailBuilder.size <= 0) {
            this.logger.log('Everything is fine');

            return;
        }

        this.logger.log(`Found ${emailBuilder.size} invalid connectors. Sending email...`);

        const text = emailBuilder.toString();
        const transporter = createTransport(
            this.config.output.email.smtp,
            {
                from: this.config.output.email.sender,
            }
        );

        try {
            const message: SendMailOptions = {
                to: this.config.output.email.recipients,
                subject: 'Issue with proxies',
                text,
            };

            await transporter.sendMail(message);
        } finally {
            transporter.close();
        }
    }
}
