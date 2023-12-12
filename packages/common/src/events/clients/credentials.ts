import { Subscription } from 'rxjs';
import { AEventsService } from '../events.abstract';
import {
    CredentialCreatedEvent,
    CredentialRemovedEvent,
    CredentialUpdatedEvent,
} from '../events.interface';
import type { ICredentialView } from '../../credentials';


export class EventsCredentialsClient {
    readonly credentials: ICredentialView[] = [];

    private projectId: string | undefined = void 0;

    private readonly subscription = new Subscription();

    constructor(private readonly events: AEventsService) {}

    subscribe(
        projectId: string, credentials: ICredentialView[]
    ) {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case CredentialCreatedEvent.id: {
                    const created = event as CredentialCreatedEvent;
                    this.onCredentialCreated(created.credential);
                    break;
                }

                case CredentialUpdatedEvent.id: {
                    const updated = event as CredentialUpdatedEvent;
                    this.onCredentialUpdated(updated.credential);
                    break;
                }

                case CredentialRemovedEvent.id: {
                    const removed = event as CredentialRemovedEvent;
                    this.onCredentialRemoved(removed.credential);
                    break;
                }
            }
        }));

        this.projectId = projectId;
        this.credentials.length = 0;

        const credentialsSorted = credentials.sort((
            a, b
        )=> a.name.localeCompare(b.name));
        this.credentials.push(...credentialsSorted);
    }

    unsubscribe() {
        this.subscription.unsubscribe();
    }

    private onCredentialCreated(credential: ICredentialView) {
        if (!this.projectId ||
                this.projectId !== credential.projectId) {
            return;
        }

        this.credentials.push(credential);
        this.credentials.sort((
            a, b
        ) => a.name.localeCompare(b.name));
    }

    private onCredentialUpdated(credential: ICredentialView) {
        if (!this.projectId ||
                this.projectId !== credential.projectId) {
            return;
        }

        const ind = this.credentials.findIndex((c) => c.id === credential.id);

        if (ind < 0) {
            return;
        }

        this.credentials[ ind ] = credential;

        this.credentials.sort((
            a, b
        ) => a.name.localeCompare(b.name));
    }

    private onCredentialRemoved(credential: ICredentialView) {
        if (!this.projectId ||
            this.projectId !== credential.projectId) {
            return;
        }

        const ind = this.credentials.findIndex((c) => c.id === credential.id);

        if (ind < 0) {
            return;
        }

        this.credentials.splice(
            ind,
            1
        );
    }
}
