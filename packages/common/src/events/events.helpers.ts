import type {
    IEvent,
    IProjectNamespace,
} from './events.interface';


export function formatProjectNamespace(namespace: IProjectNamespace): string {
    return `${namespace.scope}::${namespace.projectId}`;
}


export function formatEventNamespace(event: IEvent): string {
    return `${event.scope}::${event.id}`;
}
