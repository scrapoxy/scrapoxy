import { Socket } from 'net';


export interface ISockets {
    add: (socket: Socket, name?: string) => any;

    remove: (socket: Socket) => any;

    closeAll: () => any;
}


export class Sockets implements ISockets {
    private readonly sockets: Socket[] = [];

    constructor(private readonly parent?: ISockets) {}

    public add(
        socket: Socket,
        name?: string
    ) {
        if (this.sockets.includes(socket)) {
            throw new Error('Socket already exists');
        }

        if (this.parent) {
            this.parent.add(
                socket,
                name
            );
        }

        this.sockets.push(socket);
    }

    public remove(socket: Socket) {
        const ind = this.sockets.indexOf(socket);

        if (ind >= 0) {
            this.sockets.splice(
                ind,
                1
            );
        }

        if (this.parent) {
            this.parent.remove(socket);
        }
    }

    public closeAll() {
        while (this.sockets.length > 0) {
            const socket = this.sockets.shift() as Socket;

            if (this.parent) {
                this.parent.remove(socket);
            }

            socket.destroy();
        }

        this.sockets.length = 0;
    }

    get size(): number {
        return this.sockets.length;
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
