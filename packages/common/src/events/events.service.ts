import {
    io,
    Socket,
} from 'socket.io-client';
import { AEventsService } from './events.abstract';
import { ConnectedEvent } from './events.interface';
import { AUTH_COOKIE } from '../info';
import type { IProjectNamespace } from './events.interface';


export class EventsService extends AEventsService {
    public connected = false;

    public firstConnection = true;

    private socket: Socket | undefined = void 0;

    private error: any = void 0;

    popError() {
        const val = this.error;
        this.error = void 0;

        return val;
    }

    connect(
        url = '',
        token: string | undefined = void 0
    ): Promise<void> {
        return new Promise((
            resolve, reject
        ) => {
            let transportOptions;

            if (token) {
                transportOptions = {
                    polling: {
                        extraHeaders: {
                            Cookie: `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict`,
                        },
                    },
                };
            } else {
                transportOptions = {};
            }

            this.socket = io(
                url,
                {
                    path: '/socket.io',
                    transports: [
                        'polling',
                    ],
                    transportOptions,
                }
            );

            this.socket.on(
                'connect_error',
                (err: any) => {
                    console.error(
                        '[EventsService] connect_error',
                        err
                    );

                    reject(err);
                }
            );

            this.socket.on(
                'connect',
                () => {
                    this.onConnect();

                    resolve();
                }
            );

            this.socket.on(
                'disconnect',
                () => {
                    this.onDisconnect();
                }
            );

            this.socket.on(
                'register::error',
                (err: any) => {
                    console.error(
                        '[EventsService] register::error',
                        err
                    );

                    this.error = err;
                }
            );

            this.socket.on(
                'exception',
                (err: any) => {
                    console.error(
                        '[EventsService] exception',
                        err
                    );

                    this.error = err.message;
                }
            );

            this.socket.on(
                'event',
                (data) => {
                    if (!data) {
                        return;
                    }

                    this.onEvent(data);
                }
            );
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = void 0;
    }

    override register(namespace: IProjectNamespace) {
        super.register(namespace);

        if (this.socket) {
            this.socket.emit(
                'register',
                namespace
            );
        }
    }

    override async registerAsync(namespace: IProjectNamespace): Promise<void> {
        await super.registerAsync(namespace);

        if (this.socket) {
            const valid = await this.socket.emitWithAck(
                'register',
                namespace
            );

            if (!valid) {
                console.error(
                    '[EventsService] register::error',
                    `Cannot register namespace ${namespace.scope} ${namespace.projectId}`
                );
            }
        }
    }

    override unregister(namespace: IProjectNamespace) {
        super.unregister(namespace);

        if (this.socket) {
            this.socket.emit(
                'unregister',
                namespace
            );
        }
    }

    override async unregisterAsync(namespace: IProjectNamespace): Promise<void> {
        await super.unregisterAsync(namespace);

        if (this.socket) {
            const valid = await this.socket.emitWithAck(
                'unregister',
                namespace
            );

            if (!valid) {
                console.error(
                    '[EventsService] unregister::error',
                    `Cannot unregister namespace ${namespace.scope} ${namespace.projectId}`
                );
            }
        }
    }

    private onConnect() {
        // On connect, re-register all namespaces
        if (this.socket) {
            for (const namespace of this.namespaces.values()) {
                this.socket.emit(
                    'register',
                    namespace
                );
            }
        }

        this.connected = true;
        this.emit(new ConnectedEvent(
            this.connected,
            this.firstConnection
        ));
    }

    private onDisconnect() {
        this.connected = false;
        this.emit(new ConnectedEvent(
            this.connected,
            this.firstConnection
        ));
        this.firstConnection = false;
    }
}
