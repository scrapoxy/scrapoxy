import {
    Inject,
    Logger,
} from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import {
    Server,
    Socket,
} from 'socket.io';
import { COMMANDER_EVENTS_MODULE_CONFIG } from './events.constants';
import { JwtInvalidError } from '../../commander-client';
import { EventsService } from '../../events';
import { parserAuthFromHeaders } from '../../helpers';
import type { ICommanderEventsModuleConfig } from './events.module';
import type {
    OnGatewayConnection,
    OnGatewayInit,
} from '@nestjs/websockets';
import type {
    IProjectNamespace,
    IUserToken,
} from '@scrapoxy/common';


@WebSocketGateway({
    path: '/socket.io',
})
export class CommanderEventsGateway implements OnGatewayConnection, OnGatewayInit {
    @WebSocketServer()
    private readonly server!: Server;

    private readonly logger = new Logger(CommanderEventsGateway.name);

    constructor(
        @Inject(COMMANDER_EVENTS_MODULE_CONFIG)
        private readonly config: ICommanderEventsModuleConfig,
        private readonly events: EventsService
    ) {
        this.events.server = this.server;
    }

    @SubscribeMessage('register')
    async register(
        @ConnectedSocket() socket: Socket,
            @MessageBody() namespace: IProjectNamespace
    ): Promise<boolean> {
        const valid = await this.events.register(
            socket,
            namespace
        );

        return valid;
    }

    @SubscribeMessage('unregister')
    async unregister(
        @ConnectedSocket() socket: Socket, @MessageBody() namespace: IProjectNamespace
    ): Promise<boolean> {
        const valid = await this.events.unregister(
            socket,
            namespace
        );

        return valid;
    }

    afterInit(server: Server) {
        this.events.server = server;
    }

    async handleConnection(socket: Socket) {
        try {
            const token = parserAuthFromHeaders(socket.handshake.headers);

            if (!token) {
                throw new JwtInvalidError('JWT missing');
            }

            try {
                const user = jwt.verify(
                    token,
                    this.config.jwtSecret
                ) as IUserToken;

                await this.events.connect(
                    socket,
                    user
                );
            } catch (err: any) {
                throw new JwtInvalidError(err.message);
            }
        } catch (err: any) {
            socket.disconnect(true);

            this.logger.error(err);
        }
    }
}
