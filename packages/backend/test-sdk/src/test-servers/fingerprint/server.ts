import { createServer } from 'http';
import { Server } from 'net';
import {
    BadRequestException,
    Controller,
    HttpCode,
    Module,
    Post,
    Req,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { DEFAULT_FINGERPRINT } from './fingerprint.constants';
import type { IFingerprint } from '@scrapoxy/common';
import type { Request } from 'express';
import type { AddressInfo } from 'net';


const USERAGENT_REGEXP = new RegExp('^Scrapoxy\/[^ ]+ \([^;]+; [^;]+; [^;]+\)$');


@Controller()
class FingerprintController {
    @Post('json')
    @HttpCode(200)
    async getFingerprint(@Req() req: Request): Promise<IFingerprint | undefined> {
        // Check useragent
        const userAgent = req.headers[ 'user-agent' ] as string;

        if (!USERAGENT_REGEXP.exec(userAgent)) {
            throw new BadRequestException('Invalid useragent');
        }

        // Parse and return fingerprint
        let fingerprint: IFingerprint | undefined;
        const fingerprintRaw = req.headers[ 'x-fingerprint' ] as string;

        if (fingerprintRaw && fingerprintRaw.length > 0) {
            try {
                fingerprint = JSON.parse(atob(fingerprintRaw));
            } catch (err: any) {
                fingerprint = void 0;
            }
        } else {
            fingerprint = void 0;
        }

        if (!fingerprint) {
            fingerprint = DEFAULT_FINGERPRINT;
        }

        return fingerprint;
    }
}


@Module({
    controllers: [
        FingerprintController,
    ],
})
export class FingerprintModule {}


export class FingerprintServer {
    private server: Server | undefined = void 0;

    get port(): number | null {
        if (!this.server) {
            return null;
        }

        const address: AddressInfo = this.server.address() as AddressInfo;

        if (!address) {
            return null;
        }

        return address.port;
    }

    async init(): Promise<void> {
        const fingerprintServer = express();
        const fingerprintApp = await NestFactory.create(
            FingerprintModule,
            new ExpressAdapter(fingerprintServer)
        );
        fingerprintApp.setGlobalPrefix('/api');

        this.server = createServer(fingerprintServer);

        await fingerprintApp.init();
    }

    listen(port = 0): Promise<number> {
        return new Promise<number>((
            resolve, reject
        ) => {
            if (!this.server) {
                reject(new Error('Fingerprint server not initialized'));

                return;
            }

            this.server.on(
                'error',
                (err: any) => {
                    reject(new Error(`Fingerprint cannot listen at port ${port} : ${err.message}`));
                }
            );

            this.server.on(
                'listening',
                () => {
                    resolve(this.port as number);
                }
            );

            this.server.listen(port);
        });
    }

    close(): Promise<void> {
        return new Promise<void>((
            resolve, reject
        ) => {
            if (!this.server) {
                reject(new Error('Fingerprint server not initialized'));

                return;
            }

            this.server.close((err: Error | undefined) => {
                if (err) {
                    reject(err);

                    return;
                }

                resolve();
            });
        });
    }
}
