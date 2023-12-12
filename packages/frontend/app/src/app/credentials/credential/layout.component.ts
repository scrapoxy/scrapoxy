import { Component } from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { CredentialRemovedEvent } from '@scrapoxy/common';
import {
    EventsService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { Subscription } from 'rxjs';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type { ICredentialView } from '@scrapoxy/common';


@Component({
    template: '<router-outlet></router-outlet>',
})
export class CredentialLayoutComponent implements OnInit, OnDestroy {
    private projectId: string;

    private readonly subscription = new Subscription();

    constructor(
        private readonly events: EventsService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        const credentialId = this.route.snapshot.params.credentialId;

        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case CredentialRemovedEvent.id: {
                    const removed = event as CredentialRemovedEvent;
                    const credential = removed.credential;

                    if (this.projectId === credential.projectId &&
                            credentialId === credential.id) {
                        this.onCredentialRemoved(credential);
                    }

                    break;
                }
            }
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private onCredentialRemoved(credential: ICredentialView) {
        this.toastsService.success(
            'Credential',
            `Credential "${credential.name}" removed.`
        );

        (async() => {
            await this.router.navigate([
                '/projects', this.projectId, 'credentials',
            ]);
        })()
            .catch(err => {
                console.error(err);

                this.toastsService.error(
                    'Credentials Layout',
                    err.message
                );
            });
    }
}



