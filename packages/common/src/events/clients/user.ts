import { Subscription } from 'rxjs';
import { AEventsService } from '../events.abstract';
import {
    UserRemovedEvent,
    UserUpdatedEvent,
} from '../events.interface';
import type { IUserView } from '../../users';


export class EventsUserClient {
    protected readonly subscription = new Subscription();

    constructor(
        private readonly events: AEventsService,
        public user: IUserView,
        protected readonly onUserRemovedImpl?: () => void
    ) {}

    subscribe() {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case UserUpdatedEvent.id: {
                    const updated = event as UserUpdatedEvent;
                    this.onUserUpdated(updated.user);
                    break;
                }

                case UserRemovedEvent.id: {
                    const removed = event as UserRemovedEvent;
                    this.onUserRemoved(removed.user);
                    break;
                }
            }
        }));
    }

    unsubscribe() {
        this.subscription.unsubscribe();
    }

    private onUserUpdated(user: IUserView) {
        if (this.user.id !== user.id) {
            return;
        }

        this.user = user;
    }

    private onUserRemoved(user: IUserView) {
        if (this.user.id !== user.id ||
            !this.onUserRemovedImpl) {
            return;
        }

        this.onUserRemovedImpl();
    }
}
