import type { IConnectorView } from '../connectors';
import type { ICredentialView } from '../credentials';
import type {
    IFreeproxy,
    ISynchronizeFreeproxies,
} from '../freeproxies';
import type {
    IProjectData,
    IProjectMetricsAddView,
    IProjectUserLink,
    IProjectView,
} from '../projects';
import type {
    IProxyMetricsAdd,
    ISynchronizeLocalProxiesBase,
} from '../proxies';
import type { ITaskView } from '../tasks';
import type { IUserView } from '../users';


export abstract class ACommanderEvent {
    constructor(public id: string) {}
}


export enum EEventScope {
    USER = 'user',
    PROJECT = 'project',
    METRICS = 'metrics',
    PROXIES = 'proxies',
    FREEPROXIES = 'freeproxies',
}


export interface IProjectNamespace {
    projectId: string;
    scope: EEventScope;
}


export interface IEvent {
    id: string;
    scope: EEventScope;
    event: ACommanderEvent;
}


//////////// USERS ////////////
export class UserUpdatedEvent extends ACommanderEvent {
    static readonly id = 'user_updated_event';

    static from(data: any): UserUpdatedEvent {
        return new UserUpdatedEvent(data.user);
    }

    constructor(public user: IUserView) {
        super(UserUpdatedEvent.id);
    }
}


export class UserRemovedEvent extends ACommanderEvent {
    static readonly id = 'user_removed_event';

    static from(data: any): UserRemovedEvent {
        return new UserRemovedEvent(data.user);
    }

    constructor(public user: IUserView) {
        super(UserRemovedEvent.id);
    }
}


//////////// PROJECTS ////////////
export class ProjectSelectedEvent extends ACommanderEvent {
    static readonly id = 'project_selected_event';

    static from(data: any): ProjectSelectedEvent {
        return new ProjectSelectedEvent(data.project);
    }

    constructor(public project: IProjectView | undefined) {
        super(ProjectSelectedEvent.id);
    }
}


export class ProjectUpdatedEvent extends ACommanderEvent {
    static readonly id = 'project_updated_event';

    static from(data: any): ProjectUpdatedEvent {
        return new ProjectUpdatedEvent(data.project);
    }

    constructor(public project: IProjectData) {
        super(ProjectUpdatedEvent.id);
    }
}


export class ProjectUserAddedEvent extends ACommanderEvent {
    static readonly id = 'project_user_added_event';

    static from(data: any): ProjectUserAddedEvent {
        return new ProjectUserAddedEvent(data.link);
    }

    constructor(public link: IProjectUserLink) {
        super(ProjectUserAddedEvent.id);
    }
}


export class ProjectUserRemovedEvent extends ACommanderEvent {
    static readonly id = 'project_user_removed_event';

    static from(data: any): ProjectUserRemovedEvent {
        return new ProjectUserRemovedEvent(data.link);
    }

    constructor(public link: IProjectUserLink) {
        super(ProjectUserRemovedEvent.id);
    }
}


export class ProjectMetricsAddedEvent extends ACommanderEvent {
    static readonly id = 'project_metrics_added_event';

    static from(data: any): ProjectMetricsAddedEvent {
        return new ProjectMetricsAddedEvent(data.view);
    }

    constructor(public view: IProjectMetricsAddView) {
        super(ProjectMetricsAddedEvent.id);
    }
}


export class ProjectRemovedEvent extends ACommanderEvent {
    static readonly id = 'project_removed_event';

    static from(data: any): ProjectRemovedEvent {
        return new ProjectRemovedEvent(data.project);
    }

    constructor(public project: IProjectData) {
        super(ProjectRemovedEvent.id);
    }
}


//////////// CREDENTIALS ////////////
export class CredentialCreatedEvent extends ACommanderEvent {
    static readonly id = 'credential_created_event';

    static from(data: any): CredentialCreatedEvent {
        return new CredentialCreatedEvent(data.credential);
    }

    constructor(public credential: ICredentialView) {
        super(CredentialCreatedEvent.id);
    }
}


export class CredentialUpdatedEvent extends ACommanderEvent {
    static readonly id = 'credential_updated_event';

    static from(data: any): CredentialUpdatedEvent {
        return new CredentialUpdatedEvent(data.credential);
    }

    constructor(public credential: ICredentialView) {
        super(CredentialUpdatedEvent.id);
    }
}


export class CredentialRemovedEvent extends ACommanderEvent {
    static readonly id = 'credential_removed_event';

    static from(data: any): CredentialRemovedEvent {
        return new CredentialRemovedEvent(data.credential);
    }

    constructor(public credential: ICredentialView) {
        super(CredentialRemovedEvent.id);
    }
}


//////////// CONNECTORS ////////////
export class ConnectorCreatedEvent extends ACommanderEvent {
    static readonly id = 'connector_created_event';

    static from(data: any): ConnectorCreatedEvent {
        return new ConnectorCreatedEvent(data.connector);
    }

    constructor(public connector: IConnectorView) {
        super(ConnectorCreatedEvent.id);
    }
}


export class ConnectorUpdatedEvent extends ACommanderEvent {
    static readonly id = 'connector_updated_event';

    static from(data: any): ConnectorUpdatedEvent {
        return new ConnectorUpdatedEvent(data.connector);
    }

    constructor(public connector: IConnectorView) {
        super(ConnectorUpdatedEvent.id);
    }
}


export class ConnectorRemovedEvent extends ACommanderEvent {
    static readonly id = 'connector_removed_event';

    static from(data: any): ConnectorRemovedEvent {
        return new ConnectorRemovedEvent(data.connector);
    }

    constructor(public connector: IConnectorView) {
        super(ConnectorRemovedEvent.id);
    }
}


//////////// PROXIES ////////////
export class ProxiesSynchronizedEvent extends ACommanderEvent {
    static readonly id = 'proxies_synchronized_event';

    static from(data: any): ProxiesSynchronizedEvent {
        return new ProxiesSynchronizedEvent(data.actions);
    }

    constructor(public actions: ISynchronizeLocalProxiesBase) {
        super(ProxiesSynchronizedEvent.id);
    }
}


export class ProxiesMetricsAddedEvent extends ACommanderEvent {
    static readonly id = 'proxies_metrics_added_event';

    static from(data: any): ProxiesMetricsAddedEvent {
        return new ProxiesMetricsAddedEvent(data.proxies);
    }

    constructor(public proxies: IProxyMetricsAdd[]) {
        super(ProxiesMetricsAddedEvent.id);
    }
}


//////////// FREE PROXIES ////////////
export class FreeproxiesCreatedEvent extends ACommanderEvent {
    static readonly id = 'freeproxies_created_event';

    static from(data: any): FreeproxiesCreatedEvent {
        return new FreeproxiesCreatedEvent(data.freeproxies);
    }

    constructor(public freeproxies: IFreeproxy[]) {
        super(FreeproxiesCreatedEvent.id);
    }
}


export class FreeproxiesSynchronizedEvent extends ACommanderEvent {
    static readonly id = 'freeproxies_synchronized_event';

    static from(data: any): FreeproxiesSynchronizedEvent {
        return new FreeproxiesSynchronizedEvent(data.actions);
    }

    constructor(public actions: ISynchronizeFreeproxies) {
        super(FreeproxiesSynchronizedEvent.id);
    }
}


//////////// TASKS ////////////
export class TaskCreatedEvent extends ACommanderEvent {
    static readonly id = 'task_created_event';

    static from(data: any): TaskCreatedEvent {
        return new TaskCreatedEvent(data.task);
    }

    constructor(public task: ITaskView) {
        super(TaskCreatedEvent.id);
    }
}


export class TaskUpdatedEvent extends ACommanderEvent {
    static readonly id = 'task_updated_event';

    static from(data: any): TaskUpdatedEvent {
        return new TaskUpdatedEvent(data.task);
    }

    constructor(public task: ITaskView) {
        super(TaskUpdatedEvent.id);
    }
}


export class TaskRemovedEvent extends ACommanderEvent {
    static readonly id = 'task_removed_event';

    static from(data: any): TaskRemovedEvent {
        return new TaskRemovedEvent(data.task);
    }

    constructor(public task: ITaskView) {
        super(TaskRemovedEvent.id);
    }
}


//////////// CONNECTED ////////////
export class ConnectedEvent extends ACommanderEvent {
    static readonly id = 'connected_event';

    static from(data: any): ConnectedEvent {
        return new ConnectedEvent(
            data.connected,
            data.firstConnection
        );
    }

    constructor(
        public connected: boolean,
        public firstConnection: boolean
    ) {
        super(ConnectedEvent.id);
    }
}
