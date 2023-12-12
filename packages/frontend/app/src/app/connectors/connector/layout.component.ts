import { Component } from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { ConnectorRemovedEvent } from '@scrapoxy/common';
import {
    EventsService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { Subscription } from 'rxjs';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type { IConnectorView } from '@scrapoxy/common';


@Component({
    template: '<router-outlet></router-outlet>',
})
export class ConnectorLayoutComponent implements OnInit, OnDestroy {
    private connectorId: string;

    private projectId: string;

    private readonly subscription = new Subscription();

    constructor(
        private readonly events: EventsService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
    }

    async ngOnInit() {
        this.projectId = this.route.snapshot.params.projectId;
        this.connectorId = this.route.snapshot.params.connectorId;

        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ConnectorRemovedEvent.id: {
                    const removed = event as ConnectorRemovedEvent;
                    this.onConnectorRemoved(removed.connector);
                    break;
                }
            }
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private onConnectorRemoved(connector: IConnectorView) {
        if (this.projectId !== connector.projectId ||
            this.connectorId !== connector.id) {
            return;
        }

        // Toast already done in project-layout.component.ts

        (async() => {
            await this.router.navigate([
                '/projects', this.projectId,
            ]);
        })()
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Layout',
                    err.message
                );
            });
    }
}



