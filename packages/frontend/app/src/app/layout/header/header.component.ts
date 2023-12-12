import {
    Component,
    Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '@coreui/angular';
import { EventsUserClient } from '@scrapoxy/common';
import {
    CommanderUsersClientService,
    EventsService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';


@Component({
    selector: 'app-layout-header',
    templateUrl: './header.component.html',
    styleUrls: [
        './header.component.scss',
    ],
})
export class LayoutHeaderComponent extends HeaderComponent implements OnInit, OnDestroy {

    @Input() sidebarId = 'sidebar';

    client: EventsUserClient;

    constructor(
        private readonly commanderUsers: CommanderUsersClientService,
        private readonly events: EventsService,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        super();
    }

    async ngOnInit(): Promise<void> {
        // Get Me
        try {
            const user = await this.commanderUsers.getUserMe();

            // If profile is incomplete, redirect user to complete it
            if (!user.complete) {
                await this.router.navigate([
                    '/profile',
                ]);
            }

            this.client = new EventsUserClient(
                this.events,
                user,
                () => {
                    this.logout();
                }
            );

            this.client.subscribe();
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Layout',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.client.unsubscribe();
    }

    logout() {
        this.commanderUsers.logout();
    }
}
