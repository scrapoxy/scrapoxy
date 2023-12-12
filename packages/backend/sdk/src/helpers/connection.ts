import {
    createConnection,
    Socket,
} from 'net';
import { connect } from 'tls';
import { isUrl } from './url';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type { ClientRequestArgs } from 'http';
import type { ConnectionOptions } from 'tls';


export interface ICreateConnectionAutoOptions {
    ca?: string;
    cert?: string;
    key?: string;
}


export function createConnectionAuto(
    args: ClientRequestArgs,
    oncreate: (err: Error, socket: Socket) => void,
    sockets: ISockets,
    namePrefix: string,
    tls?: ICreateConnectionAutoOptions
): Socket {
    if (!args.timeout || args.timeout <= 0) {
        // Failsafe check for connection timeout
        oncreate(
            new Error('Timeout is required on socket'),
            void 0 as any
        );

        return void 0 as any;
    }

    let socket: Socket;

    if (tls) {
        const options: ConnectionOptions = {
            host: args.hostname as string,
            port: args.port as number,
            requestCert: true,
            rejectUnauthorized: false,
            timeout: args.timeout,
            ...tls,
        };

        if (isUrl(args.hostname)) {
            options.servername = args.hostname as string;
        }

        socket = connect(options);
    } else {
        socket = createConnection({
            host: args.hostname as string,
            port: args.port as number,
            timeout: args.timeout,
        });
    }

    socket.on(
        'error',
        (err: any) => {
            oncreate(
                err,
                void 0 as any
            );
        }
    );

    socket.on(
        'close',
        () => {
            sockets.remove(socket);
        }
    );
    sockets.add(
        socket,
        `${namePrefix}:createConnectionAuto:socket`
    );


    socket.on(
        'timeout',
        () => {
            socket.destroy();
            socket.emit('close');
        }
    );

    socket.on(
        'connect',
        () => {
            oncreate(
                void 0 as any,
                socket
            );
        }
    );

    return socket;
}
