import {
    IncomingMessage,
    ServerResponse,
} from 'http';
import { Socket } from 'net';
import { ArrayHttpHeaders } from '../helpers';
import { ProxyHttp } from '../proxy';
import type { LoggerService } from '@nestjs/common';


function getSessionFromUrl(url: string | undefined): string | undefined {
    if (!url) {
        return;
    }

    const arr = /\/sessions\/(\d+)$/.exec(url);

    if (!arr) {
        return;
    }

    return arr[ 1 ] as string;
}


function getToken(header: string | undefined): string | undefined {
    if (!header) {
        return;
    }

    const arr = /^Basic (.+)$/.exec(header);

    if (!arr) {
        return;
    }

    return arr[ 1 ] as string;
}


export class ProxyLocalApp extends ProxyHttp {
    private readonly sessions = new Set<string>();

    constructor(
        logger: LoggerService,
        timeout: number,
        private readonly token: string
    ) {
        super(
            logger,
            timeout
        );
    }

    protected override request(
        req: IncomingMessage,
        reqHeaders: ArrayHttpHeaders,
        res: ServerResponse
    ) {
        if (req.url?.startsWith('/api/sessions')) {
            this.requestSession(
                req,
                res
            );

            return;
        }

        if (getToken(req.headers[ 'proxy-authorization' ]) !== this.token) {
            res.statusCode = 401;
            res.end('Unauthorized');

            return;
        }

        delete req.headers[ 'proxy-authorization' ];

        const session = req.headers[ 'x-proxy-local-session-id' ] as string;

        if (!session) {
            res.statusCode = 400;
            res.end('No session header found');

            return;
        }

        if (!this.sessions.has(session)) {
            res.statusCode = 400;
            res.end(`Session ${session} not found`);

            return;
        }

        reqHeaders.removeHeadersWithPrefix('x-proxy-local-');

        super.request(
            req,
            reqHeaders,
            res
        );
    }

    protected override connect(
        req: IncomingMessage, socket: Socket, head: Buffer
    ) {
        if (getToken(req.headers[ 'proxy-authorization' ]) !== this.token) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.end();

            return;
        }

        const session = req.headers[ 'x-proxy-local-session-id' ] as string;

        if (!session) {
            socket.write('HTTP/1.1 400 No session header found\r\n\r\n');
            socket.end();

            return;
        }

        if (!this.sessions.has(session)) {
            socket.write(`HTTP/1.1 400 Session ${session} not found\r\n\r\n`);
            socket.end();

            return;
        }

        super.connect(
            req,
            socket,
            head
        );
    }

    private requestSession(
        req: IncomingMessage, res: ServerResponse
    ) {
        if (getToken(req.headers.authorization) !== this.token) {
            res.statusCode = 401;
            res.end('Unauthorized');

            return;
        }

        if (!req.method) {
            res.statusCode = 400;
            res.end('Invalid method');

            return;
        }

        switch (req.method) {
            case 'GET': {
                if (req.url === '/api/sessions') {
                    const sessions = Array.from(this.sessions);
                    const sessionsRaw = JSON.stringify(
                        sessions,
                        void 0,
                        2
                    );
                    res.statusCode = 200;
                    res.end(sessionsRaw);
                }

                return;
            }

            case 'POST': {
                const session = Math.ceil(Math.random() * 1000000)
                    .toString(10);
                this.sessions.add(session);

                res.statusCode = 200;
                res.end(session);

                return;
            }

            case 'DELETE': {
                const session = getSessionFromUrl(req.url);

                if (!session || !this.sessions.has(session)) {
                    res.statusCode = 404;
                    res.end('Session not found');

                    return;
                }

                this.sessions.delete(session);

                res.statusCode = 204;
                res.end();

                return;
            }
        }

        res.statusCode = 404;
        res.end('Not found');
    }
}
