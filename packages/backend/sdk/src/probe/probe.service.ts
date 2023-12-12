import {
    createServer,
    IncomingMessage,
    Server,
    ServerResponse,
} from 'http';
import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { PROBE_MODULE_CONFIG } from './probe.constants';
import { ProbeprovidersService } from './providers';
import type { IProbeModuleConfig } from './probe.module';
import type {
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import type { AddressInfo } from 'net';


@Injectable()
export class ProbeService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ProbeService.name);

    private readonly server: Server;

    constructor(
        @Inject(PROBE_MODULE_CONFIG)
        private readonly config: IProbeModuleConfig,
        private readonly probeprovidersService: ProbeprovidersService
    ) {
        this.server = createServer();
        this.server.on(
            'request',
            (
                req, res
            ) => {
                (async() => this.request(
                    req,
                    res
                ))()
                    .catch((err: any)=>{
                        this.logger.error(err);
                    });
            }
        );
    }

    async onModuleInit() {
        const port = await this.listen();
        this.logger.log(`Probe is listening at port ${port}`);
    }

    async onModuleDestroy() {
        await this.close();
    }

    get port(): number | null {
        const address = this.server.address() as AddressInfo;

        if (!address) {
            return null;
        }

        return address.port;
    }

    private async request(
        req: IncomingMessage, res: ServerResponse
    ): Promise<void> {
        const probeStatus = this.probeprovidersService.getProbeStatus();
        // If at least one probe is not alive, return 400
        const status = Object.values(probeStatus)
            .includes(false) ? 400 : 200;

        res.writeHead(
            status,
            {
                'Content-Type': 'application/json',
            }
        );

        res.write(JSON.stringify(probeStatus));

        res.end();
    }

    private listen(): Promise<number> {
        return new Promise<number>((
            resolve, reject
        ) => {
            this.server.on(
                'error',
                (err: any) => {
                    reject(new Error(`Cannot listen at port ${this.config.port}: ${err.message}`));
                }
            );

            this.server.on(
                'listening',
                () => {
                    resolve(this.port as number);
                }
            );

            this.server.listen(this.config.port);
        });
    }

    private close(): Promise<void> {
        this.logger.log('Shutdown probe');

        return new Promise<void>((
            resolve, reject
        ) => {
            this.server.close((err: any) => {
                if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
                    reject(err);

                    return;
                }

                resolve();
            });
        });
    }
}
