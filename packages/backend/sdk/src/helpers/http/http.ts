import { Agent as AgentHttp } from 'http';
import { Agent as AgentHttps } from 'https';
import { Socket } from 'net';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ONE_SECOND_IN_MS } from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import type { NestApplicationOptions } from '@nestjs/common';
import type { CreateAxiosDefaults } from 'axios';


export class Agents {
    TIMEOUT = 10 * ONE_SECOND_IN_MS;

    private readonly httpInstance = new AgentHttp({
        keepAlive: true,
    });

    private readonly httpsInstance = new AgentHttps({
        keepAlive: true,
    });

    get axiosDefaults(): CreateAxiosDefaults {
        return {
            timeout: this.TIMEOUT,
            httpAgent: this.httpInstance,
            httpsAgent: this.httpsInstance,
        };
    }

    get http(): AgentHttp {
        return this.httpInstance;
    }

    get https(): AgentHttps {
        return this.httpsInstance;
    }

    close() {
        this.httpInstance.destroy();
        this.httpsInstance.destroy();
    }
}


/**
 * Close keep-alive connections when HTTP server.
 * Behavior is different from forceCloseConnections, which destroy before onModuleDestroy/onApplicationShutdown
 * and not after. This is useful for finish current requests needed in onModuleDestroy/onApplicationShutdown.
 */
export class ScrapoxyExpressAdapter extends ExpressAdapter {
    private readonly sockets = new Sockets();

    override initHttpServer(options: NestApplicationOptions) {
        super.initHttpServer(options);

        const close = this.httpServer.close.bind(this.httpServer);
        this.httpServer.close = (callback?: (err?: Error) => void) => {
            this.sockets.closeAll();

            return close(callback);
        };

        this.httpServer.on(
            'connection',
            (socket) => {
                this.registerSocket(socket);
            }
        );
        this.httpServer.on(
            'secureConnection',
            (socket) => {
                this.registerSocket(socket);
            }
        );
    }

    private registerSocket(socket: Socket) {
        socket.on(
            'close',
            () => {
                this.sockets.remove(socket);
            }
        );
        this.sockets.add(socket);
    }
}


export type AxiosFormDataValue = string | number | boolean;


export class AxiosFormData {
    private data: { [s: string]: AxiosFormDataValue } = {};

    constructor(obj?: { [s: string]: AxiosFormDataValue | undefined }) {
        if (obj) {
            this.appendObject(obj);
        }
    }

    public append(
        key: string, value: AxiosFormDataValue | undefined
    ) {
        if (!value && value !== 0) {
            value = '';
        }

        this.data[ key ] = value;
    }

    public appendObject(obj: { [s: string]: AxiosFormDataValue | undefined }) {
        for (const [
            key, value,
        ] of Object.entries(obj)) {
            this.append(
                key,
                value
            );
        }
    }

    public has(key: string): boolean {
        return key in this.data;
    }

    public toString(): string {
        return Object.entries(this.data)
            .map(([
                key, value,
            ]) => `${key}=${encodeURIComponent(value as AxiosFormDataValue)
                .replace(
                    /%20/g,
                    '+'
                )}`)
            .join('&');
    }
}
