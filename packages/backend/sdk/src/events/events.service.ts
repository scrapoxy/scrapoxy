import { Injectable } from '@nestjs/common';
import {
    EEventScope,
    formatEventNamespace,
    formatProjectNamespace,
    ProjectUserRemovedEvent,
} from '@scrapoxy/common';
import {
    Server,
    Socket,
} from 'socket.io';
import { schemaProjectNamespace } from './events.validation';
import { ProjectInaccessibleError } from '../commander-client';
import { validate } from '../helpers';
import { StorageprovidersService } from '../storages';
import type {
    IEvent,
    IProjectNamespace,
    IProjectUserLink,
    IUserToken,
    IUserView,
} from '@scrapoxy/common';


@Injectable()
export class EventsService {
    public server!: Server;

    constructor(private readonly storageproviders: StorageprovidersService) {
    }

    async connect(
        socket: Socket, user: IUserToken
    ) {
        (socket as any).user = user;

        const key = `user::${user.id}`;
        await socket.join(key);
    }

    async register(
        socket: Socket,
        namespace: IProjectNamespace
    ): Promise<boolean> {
        try {
            const user = (socket as any).user;

            await validate(
                schemaProjectNamespace,
                namespace
            );

            const canAccess = await this.storageproviders.storage.canUserAccessToProject(
                namespace.projectId,
                user.id
            );

            if (!canAccess) {
                throw new ProjectInaccessibleError(
                    namespace.projectId,
                    user.id
                );
            }

            const key = formatProjectNamespace(namespace);
            await socket.join(key);

            return true;
        } catch (err: any) {
            socket.emit(
                'register::error',
                err.response ?? err.message
            );

            return false;
        }
    }

    async unregister(
        socket: Socket, namespace: IProjectNamespace
    ): Promise<boolean> {
        try {
            await validate(
                schemaProjectNamespace,
                namespace
            );

            const key = formatProjectNamespace(namespace);
            await socket.leave(key);

            return true;
        } catch (err: any) {
            socket.emit(
                'register::error',
                err.response ?? err.message
            );

            return false;
        }
    }

    async emit(event: IEvent) {
        const key = formatEventNamespace(event);

        this.server.to(key)
            .emit(
                'event',
                event.event
            );

        if (event.event.id === ProjectUserRemovedEvent.id) {
            const removed = event.event as ProjectUserRemovedEvent;
            await this.leaveAll(removed.link);
        }
    }

    private async leaveAll(link: IProjectUserLink): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const scope of Object.values(EEventScope)) {
            const key = formatProjectNamespace({
                projectId: link.projectId,
                scope,
            });
            const clientsIds = this.server.sockets.adapter.rooms.get(key) ?? [];
            for (const clientId of clientsIds) {
                const socket = this.server.sockets.sockets.get(clientId);

                if (socket) {
                    const user = (socket as any).user as IUserView;

                    if (user.id === link.userId) {
                        promises.push(socket.leave(key) as Promise<void>);
                    }
                }
            }
        }

        await Promise.all(promises);
    }
}
