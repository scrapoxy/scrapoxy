import {
    Observable,
    Subject,
} from 'rxjs';
import { formatProjectNamespace } from './events.helpers';
import {
    ACommanderEvent,
    ConnectedEvent,
    ConnectorCreatedEvent,
    ConnectorRemovedEvent,
    ConnectorUpdatedEvent,
    CredentialCreatedEvent,
    CredentialRemovedEvent,
    CredentialUpdatedEvent,
    FreeproxiesCreatedEvent,
    FreeproxiesSynchronizedEvent,
    ProjectMetricsAddedEvent,
    ProjectRemovedEvent,
    ProjectSelectedEvent,
    ProjectUpdatedEvent,
    ProjectUserAddedEvent,
    ProjectUserRemovedEvent,
    ProxiesMetricsAddedEvent,
    ProxiesSynchronizedEvent,
    TaskCreatedEvent,
    TaskRemovedEvent,
    TaskUpdatedEvent,
    UserRemovedEvent,
    UserUpdatedEvent,
} from './events.interface';
import type { IProjectNamespace } from './events.interface';


export abstract class AEventsService {
    event$: Observable<ACommanderEvent>;

    protected readonly namespaces = new Map<string, IProjectNamespace>();

    private readonly eventSource: Subject<ACommanderEvent>;

    private eventsCountValue = 0;

    constructor() {
        this.eventSource = new Subject<ACommanderEvent>();
        this.event$ = this.eventSource.asObservable();
    }

    get eventsCount(): number {
        return this.eventsCountValue;
    }

    emit(event: ACommanderEvent) {
        this.eventSource.next(event);
    }

    register(namespace: IProjectNamespace) {
        if (!namespace.scope) {
            throw new Error('Scope is required');
        }

        if (!namespace.projectId) {
            throw new Error('projectId is required');
        }

        const key = formatProjectNamespace(namespace);
        this.namespaces.set(
            key,
            namespace
        );
    }

    async registerAsync(namespace: IProjectNamespace): Promise<void> {
        if (!namespace.scope) {
            throw new Error('Scope is required');
        }

        if (!namespace.projectId) {
            throw new Error('projectId is required');
        }

        const key = formatProjectNamespace(namespace);
        this.namespaces.set(
            key,
            namespace
        );
    }

    unregister(namespace: IProjectNamespace) {
        if (!namespace.scope) {
            throw new Error('Scope is required');
        }

        if (!namespace.projectId) {
            throw new Error('projectId is required');
        }

        const key = formatProjectNamespace(namespace);
        this.namespaces.delete(key);
    }

    async unregisterAsync(namespace: IProjectNamespace): Promise<void> {
        if (!namespace.scope) {
            throw new Error('Scope is required');
        }

        if (!namespace.projectId) {
            throw new Error('projectId is required');
        }

        const key = formatProjectNamespace(namespace);
        this.namespaces.delete(key);
    }

    protected onEvent(event: ACommanderEvent) {
        if (!event?.id) {
            return;
        }

        if (this.eventsCountValue >= Number.MAX_VALUE) {
            this.eventsCountValue = 0;
        } else {
            this.eventsCountValue++;
        }

        switch (event.id) {
            //////////// USERS ////////////
            case UserUpdatedEvent.id: {
                this.emit(UserUpdatedEvent.from(event));
                break;
            }

            case UserRemovedEvent.id: {
                this.emit(UserRemovedEvent.from(event));
                break;
            }

            //////////// PROJECTS ////////////
            case ProjectSelectedEvent.id: {
                this.emit(ProjectSelectedEvent.from(event));
                break;
            }

            case ProjectUpdatedEvent.id: {
                this.emit(ProjectUpdatedEvent.from(event));
                break;
            }

            case ProjectUserAddedEvent.id: {
                this.emit(ProjectUserAddedEvent.from(event));
                break;
            }

            case ProjectUserRemovedEvent.id: {
                this.emit(ProjectUserRemovedEvent.from(event));
                break;
            }

            case ProjectMetricsAddedEvent.id: {
                this.emit(ProjectMetricsAddedEvent.from(event));
                break;
            }

            case ProjectRemovedEvent.id: {
                this.emit(ProjectRemovedEvent.from(event));
                break;
            }

            //////////// CREDENTIALS ////////////
            case CredentialCreatedEvent.id: {
                this.emit(CredentialCreatedEvent.from(event));
                break;
            }

            case CredentialUpdatedEvent.id: {
                this.emit(CredentialUpdatedEvent.from(event));
                break;
            }

            case CredentialRemovedEvent.id: {
                this.emit(CredentialRemovedEvent.from(event));
                break;
            }

            //////////// CONNECTORS ////////////
            case ConnectorCreatedEvent.id: {
                this.emit(ConnectorCreatedEvent.from(event));
                break;
            }

            case ConnectorUpdatedEvent.id: {
                this.emit(ConnectorUpdatedEvent.from(event));
                break;
            }

            case ConnectorRemovedEvent.id: {
                this.emit(ConnectorRemovedEvent.from(event));
                break;
            }

            //////////// PROXIES ////////////
            case ProxiesSynchronizedEvent.id: {
                this.emit(ProxiesSynchronizedEvent.from(event));
                break;
            }

            case ProxiesMetricsAddedEvent.id: {
                this.emit(ProxiesMetricsAddedEvent.from(event));
                break;
            }

            //////////// FREE PROXIES ////////////
            case FreeproxiesCreatedEvent.id: {
                this.emit(FreeproxiesCreatedEvent.from(event));
                break;
            }

            case FreeproxiesSynchronizedEvent.id: {
                this.emit(FreeproxiesSynchronizedEvent.from(event));
                break;
            }

            //////////// TASKS ////////////
            case TaskCreatedEvent.id: {
                this.emit(TaskCreatedEvent.from(event));
                break;
            }

            case TaskUpdatedEvent.id: {
                this.emit(TaskUpdatedEvent.from(event));
                break;
            }

            case TaskRemovedEvent.id: {
                this.emit(TaskRemovedEvent.from(event));
                break;
            }

            //////////// CONNECTED ////////////
            case ConnectedEvent.id: {
                this.emit(ConnectedEvent.from(event));
                break;
            }
        }
    }
}
