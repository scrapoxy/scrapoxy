import { createServer as createServerHttp } from 'http';
import { createServer as createServerHttps } from 'https';
import { createSecureContext } from 'tls';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { FingerprintServer } from './fingerprint';
import {
    WebModule,
    WebServer,
} from './web';
import { generateCertificateSelfSignedForTest } from '../certificate.helper';
import type { SecureContext } from 'tls';


export class TestServers {
    private readonly logger = new Logger(TestServers.name);

    private httpServer!: WebServer;

    private httpsServer!: WebServer;

    private fingerprintServer!: FingerprintServer;

    get portHttp(): number {
        const port = this.httpServer.port;

        if (!port) {
            throw new Error('HTTP not initialized');
        }

        return port;
    }

    get urlHttp(): string {
        return `http://localhost:${this.portHttp}`;
    }

    get portHttps(): number {
        const port = this.httpsServer.port;

        if (!port) {
            throw new Error('HTTPS not initialized');
        }

        return port;
    }

    get urlHttps(): string {
        return `https://localhost:${this.portHttps}`;
    }

    get urlFingerprint(): string {
        const port = this.fingerprintServer.port;

        if (!port) {
            throw new Error('fingerprint server not initialized');
        }

        return `http://localhost:${port}/api/json`;
    }

    async listen(): Promise<void> {
        // HTTP & HTTPS servers
        const server = express();
        const app = await NestFactory.create(
            WebModule,
            new ExpressAdapter(server)
        );
        await app.init();

        const certificate = generateCertificateSelfSignedForTest();
        this.httpServer = new WebServer(createServerHttp(server));
        this.httpsServer = new WebServer(createServerHttps(
            {
                requestCert: true,
                rejectUnauthorized: false,
                ca: certificate.cert,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                SNICallback: (
                    servername: string, cb: (err: Error | null, ctx?: SecureContext) => void
                ) => {
                    if (!servername || servername.length <= 0) {
                        cb(new Error('servername is undefined'));

                        return;
                    }

                    cb(
                        null,
                        createSecureContext({
                            cert: certificate.cert,
                            key: certificate.key,
                        })
                    );
                },
            },
            server
        ));
        // Fingerprint server
        this.fingerprintServer = new FingerprintServer();
        await this.fingerprintServer.init();

        await Promise.all([
            this.httpServer.listen()
                .then((port) => {
                    this.logger.debug(`Webserver HTTP is listening at port ${port}`);
                }),
            this.httpsServer.listen()
                .then((port) => {
                    this.logger.debug(`Webserver HTTPS is listening at port ${port}`);
                }),
            this.fingerprintServer.listen()
                .then((port) => {
                    this.logger.debug(`Fingerprint server is listening at port ${port}`);
                }),
        ]);
    }

    async close(): Promise<void> {
        await Promise.all([
            this.httpServer.close()
                .then(() => {
                    this.logger.debug('Webserver HTTP shutdown');
                }),
            this.httpsServer.close()
                .then(() => {
                    this.logger.debug('Webserver HTTPS shutdown');
                }),
            this.fingerprintServer.close()
                .then(() => {
                    this.logger.debug('Fingerprint server shutdown');
                }),
        ]);
    }
}
