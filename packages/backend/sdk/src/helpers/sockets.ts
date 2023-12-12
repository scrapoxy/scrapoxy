import { Socket } from 'net';
import type { ISockets } from '@scrapoxy/proxy-sdk';


export class SocketsDebug implements ISockets {
    private readonly sockets = new Map<string, Socket>();

    constructor(private readonly parent?: ISockets) {
    }

    public add(
        socket: Socket, name?: string
    ) {
        if (!name || name.length <= 0) {
            throw new Error('name is empty');
        }

        if (this.sockets.has(name) ||
            Array
                .from(this.sockets.values())
                .includes(socket)) {
            throw new Error(`Socket ${name} already exists`);
        }

        if (this.parent) {
            this.parent.add(
                socket,
                name
            );
        }

        this.sockets.set(
            name,
            socket
        );
    }

    public remove(socket: Socket) {
        for (const [
            name, socketFound,
        ] of this.sockets.entries()) {
            if (socket === socketFound) {
                this.sockets.delete(name);
                break;
            }
        }

        if (this.parent) {
            this.parent.remove(socket);
        }
    }

    public closeAll() {
        for (const socket of this.sockets.values()) {
            if (this.parent) {
                this.parent.remove(socket);
            }

            socket.destroy();
        }

        this.sockets.clear();
    }

    get names(): string[] {
        return Array.from(this.sockets.keys());
    }
}


export function socketWriteAsync(
    socket: Socket, buffer: string | Uint8Array
): Promise<void> {
    return new Promise<void>((
        resolve, reject
    ) => {
        socket.write(
            buffer,
            (err: Error | undefined) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}
