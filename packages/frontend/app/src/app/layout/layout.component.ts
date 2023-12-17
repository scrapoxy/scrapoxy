import {
    Component,
    QueryList,
    ViewChildren,
} from '@angular/core';
import { ToasterComponent } from '@coreui/angular';
import {
    ConnectedEvent,
    ProjectSelectedEvent,
    ProjectUpdatedEvent,
} from '@scrapoxy/common';
import {
    EToasterType,
    EventsService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { Subscription } from 'rxjs';
import { ToastMessageComponent } from './toasts/message.component';
import type {
    AfterViewInit,
    OnDestroy,
    OnInit,
} from '@angular/core';
import type { INavData } from '@coreui/angular';
import type {
    IProjectData,
    IProjectView,
} from '@scrapoxy/common';


@Component({
    selector: 'app-dashboard',
    templateUrl: './layout.component.html',
    styleUrls: [
        './layout.component.scss',
    ],
})
export class LayoutComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChildren(ToasterComponent) viewChildren!: QueryList<ToasterComponent>;

    connected: boolean;

    navItems: INavData[] = [];

    perfectScrollbarConfig = {
        suppressScrollX: true,
    };

    private readonly subscription = new Subscription();

    private project: IProjectView | undefined = void 0;

    constructor(
        private readonly events: EventsService,
        private readonly toastsService: ToastsService
    ) {
        this.connected = events.connected;
    }

    ngOnInit() {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ProjectUpdatedEvent.id: {
                    const updated = event as ProjectUpdatedEvent;
                    this.onProjectUpdated(updated.project);
                    break;
                }

                case ProjectSelectedEvent.id: {
                    const selected = event as ProjectSelectedEvent;
                    this.onProjectSelected(selected.project);
                    break;
                }

                case ConnectedEvent.id: {
                    const connected = event as ConnectedEvent;
                    this.onClientConnected(connected.connected);
                    break;
                }
            }
        }));

        this.onProjectSelected(void 0);
    }

    ngAfterViewInit() {
        const toaster = this.viewChildren.get(0) as ToasterComponent;
        this.toastsService.register({
            toast: (
                title, message, type
            ) => {
                let color: string;
                switch (type) {
                    case EToasterType.Success: {
                        color = 'success';
                        break;
                    }

                    case EToasterType.Error: {
                        color = 'danger';
                        break;
                    }

                    default: {
                        throw new Error(`Unknown toast type ${type}`);
                    }
                }

                const options = {
                    autohide: true,
                    color,
                    delay: 5000,
                    message,
                    placement: toaster.placement,
                    title,
                };

                toaster.addToast(
                    ToastMessageComponent,
                    {
                        ...options,
                    }
                );
            },
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private onProjectUpdated(project: IProjectData) {
        if (!this.project ||
            this.project.id !== project.id) {
            return;
        }

        this.project = project;

        this.refreshNavItems();
    }

    private onProjectSelected(project: IProjectView | undefined) {
        this.project = project;

        this.refreshNavItems();
    }

    private refreshNavItems() {
        const commonItems = [
            {
                title: true,
                name: 'Projects',
            },
            {
                name: 'Projects',
                url: '/projects/view',
                iconComponent: {
                    name: 'cil-factory',
                },
            },
        ];

        if (this.project) {
            this.navItems = [
                ...commonItems,
                {
                    title: true,
                    name: this.project.name,
                },
                {
                    name: 'Marketplace',
                    url: `/projects/${this.project.id}/marketplace`,
                    iconComponent: {
                        name: 'cil-basket',
                    },
                },
                {
                    name: 'Credentials',
                    url: `/projects/${this.project.id}/credentials`,
                    iconComponent: {
                        name: 'cil-lock-locked',
                    },
                },
                {
                    name: 'Connectors',
                    url: `/projects/${this.project.id}/connectors`,
                    iconComponent: {
                        name: 'cil-cloud',
                    },
                },
                {
                    name: 'Proxies',
                    url: `/projects/${this.project.id}/proxies`,
                    iconComponent: {
                        name: 'cil-sitemap',
                    },
                },
                {
                    name: 'Coverage',
                    url: `/projects/${this.project.id}/map`,
                    iconComponent: {
                        name: 'cil-globe-alt',
                    },
                },
                {
                    name: 'Metrics',
                    url: `/projects/${this.project.id}/metrics`,
                    iconComponent: {
                        name: 'cil-speedometer',
                    },
                },
                {
                    name: 'Tasks',
                    url: `/projects/${this.project.id}/tasks`,
                    iconComponent: {
                        name: 'cil-featured-playlist',
                    },
                },
                {
                    name: 'Users',
                    url: `/projects/${this.project.id}/users`,
                    iconComponent: {
                        name: 'cil-user',
                    },
                },
                {
                    name: 'Settings',
                    url: `/projects/${this.project.id}/update`,
                    iconComponent: {
                        name: 'cil-cog',
                    },
                },
            ];
        } else {
            this.navItems = commonItems;
        }
    }

    private onClientConnected(connected: boolean) {
        this.connected = connected;
    }
}
