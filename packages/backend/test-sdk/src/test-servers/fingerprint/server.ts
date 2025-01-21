import { createServer } from 'http';
import { Server } from 'net';
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Module,
    Options,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SCRAPOXY_USER_AGENT_PREFIX } from '@scrapoxy/common';
import * as express from 'express';
import { DEFAULT_FINGERPRINT } from './fingerprint.constants';
import type { IFingerprint } from '@scrapoxy/common';
import type { Request } from 'express';
import type { AddressInfo } from 'net';


const USERAGENT_REGEXP = new RegExp(`^${SCRAPOXY_USER_AGENT_PREFIX}\/[^ ]+ \([^;]+; [^;]+; [^;]+\)$`);


@Controller()
class FingerprintController {
    @Get('json')
    @HttpCode(200)
    getFingerprintGET(
        @Req() req: Request,
            @Query() query: any
    ): Promise<IFingerprint | undefined> {
        return this.fingerprintImpl(
            req,
            query
        );
    }

    @Options('json')
    @HttpCode(200)
    getFingerprintOPTIONS(
        @Req() req: Request,
            @Query() query: any
    ): Promise<IFingerprint | undefined> {
        return this.fingerprintImpl(
            req,
            query
        );
    }

    @Post('json')
    @HttpCode(200)
    getFingerprintPOST(
        @Req() req: Request, @Body() body: any
    ): Promise<IFingerprint | undefined> {
        return this.fingerprintImpl(
            req,
            body
        );
    }

    private async fingerprintImpl(
        req: Request, payload: any
    ): Promise<IFingerprint | undefined> {
        // Check useragent
        const userAgent = req.headers[ 'user-agent' ] as string;

        if (!USERAGENT_REGEXP.exec(userAgent)) {
            throw new BadRequestException('Invalid useragent');
        }

        // Check country preference
        const countryLike = payload.country as string | undefined;
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

        if (countryLike) {
            fingerprint.countryCode = countryLike;
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
