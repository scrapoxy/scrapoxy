import {
    Component,
    Inject,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { EventsProxiesClient } from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ConnectorprovidersService,
    EventsService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    ICommanderFrontendClient,
    IProxyView,
    IProxyViewUI,
} from '@scrapoxy/common';
import type { IConnectorConfig } from '@scrapoxy/frontend-sdk';


const ITEMS_PER_PAGE = 20;


@Component({
    templateUrl: 'proxies.component.html',
    styleUrls: [
        'proxies.component.scss',
    ],
})
export class ProxiesComponent implements OnInit, OnDestroy {
    readonly client: EventsProxiesClient;

    pageCurrent = 0;

    pageMax = 0;

    projectId: string;

    projectName = '';

    proxiesLoaded = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly connectorproviders: ConnectorprovidersService,
        private readonly events: EventsService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.client = new EventsProxiesClient(
            this.events,
            (actions) => {
                if (actions.created.length + actions.removed.length > 0) {
                    this.onProxiesRefreshed();
                }
            }
        );

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            const views = await this.commander.getAllProjectConnectorsAndProxiesById(this.projectId);

            if (views.length <= 0) {
                await this.router.navigate([
                    '/projects',
                    this.projectId,
                    'connectors',
                    'create',
                ]);

                return;
            }

            this.client.subscribe(
                this.projectId,
                views
            );

            this.onProxiesRefreshed();

            this.proxiesLoaded = true;
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connectors',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.client.unsubscribe();
    }


    get proxies(): IProxyViewUI[] {
        if (!this.client) {
            return [];
        }

        const start = this.pageCurrent * ITEMS_PER_PAGE;

        return this.client.proxies.slice(
            start,
            start + ITEMS_PER_PAGE
        );
    }

    getConfig(proxy: IProxyView): IConnectorConfig | undefined {
        if (!proxy) {
            return;
        }

        const provider = this.connectorproviders.getFactory(proxy.type);

        return provider.config;
    }

    async removeProxy(
        proxy: IProxyView, force: boolean
    ): Promise<void> {
        try {
            await this.commander.askProxiesToRemove(
                this.projectId,
                [
                    {
                        id: proxy.id, force,
                    },
                ]
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Proxies',
                err.message
            );
        }
    }

    private onProxiesRefreshed() {
        this.pageMax = Math.ceil(this.client.proxies.length / ITEMS_PER_PAGE);

        this.pageCurrent = Math.min(
            this.pageCurrent,
            this.pageMax - 1
        );
    }
}
