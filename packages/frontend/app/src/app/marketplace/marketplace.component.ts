import {
    Component,
    Inject,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    CommanderFrontendClientService,
    ConnectorprovidersService,
    EConnectorFactoryGroup,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import {
    Subject,
    Subscription,
} from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
} from 'rxjs/operators';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { IConnectorConfig } from '@scrapoxy/frontend-sdk';


interface IGroupOfProviders {
    group: string;
    name: string;
    providers: {
        key: string;
        config: IConnectorConfig;
    }[];
}


@Component({
    templateUrl: './marketplace.component.html',
    styleUrls: [
        './marketplace.component.scss',
    ],
})
export class MarketplaceComponent implements OnInit, OnDestroy {
    EGroup = EConnectorFactoryGroup;

    groupsOfProvidersFiltered: IGroupOfProviders[] = [];

    projectId: string;

    projectName = '';

    providersLoaded = false;

    private readonly groupsOfProviders: IGroupOfProviders[] = [
        {
            group: EConnectorFactoryGroup.ProxiesServiceStatic,
            name: 'Static Proxies Services',
            providers: [],
        },
        {
            group: EConnectorFactoryGroup.ProxiesServiceDynamic,
            name: 'Dynamic Proxies Services',
            providers: [],
        },
        {
            group: EConnectorFactoryGroup.Hardware,
            name: 'Hardware Materials',
            providers: [],
        },
        {
            group: EConnectorFactoryGroup.DatacenterProvider,
            name: 'Datacenter Providers',
            providers: [],
        },
        {
            group: EConnectorFactoryGroup.Other,
            name: 'Others',
            providers: [],
        },
    ];

    private search = '';

    private readonly searchSubject = new Subject<string>();

    private searchSubscription: Subscription;

    constructor(
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly connectorproviders: ConnectorprovidersService,
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        this.searchSubscription = this.searchSubject
            .pipe(
                debounceTime(200),
                distinctUntilChanged()
            )
            .subscribe((search) => {
                this.search = search;
                this.update();
            });

        try {
            const backendTypes = await this.commander.getAllConnectorsTypes();
            const factories = this.connectorproviders.factories
                .filter((factory) => backendTypes.includes(factory.type));

            for (const factory of factories) {
                const group = this.groupsOfProviders.find((g) => g.group === factory.config.group);

                if (group) {
                    group.providers.push({
                        key: factory.type,
                        config: factory.config,
                    });
                } else {
                    console.log(`Group not found for type=${factory.type} and group=${factory.config.group}`);
                }
            }

            for (const group of this.groupsOfProviders) {
                group.providers.sort((
                    a, b
                ) => a.config.name.localeCompare(b.config.name));
            }

            this.update();

            this.providersLoaded = true;
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Credential Create List',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.searchSubscription.unsubscribe();
    }

    onSearchInput(event: Event) {
        const search = (event.target as HTMLInputElement).value;
        this.searchSubject.next(search.trim()
            .toLowerCase());
    }

    async create(provider: string) {
        await this.router.navigate([
            '/projects',
            this.projectId,
            'credentials',
            'create',
            provider,
        ]);
    }

    private update() {
        if (this.search.length > 0) {
            this.groupsOfProvidersFiltered = this.groupsOfProviders.map((group) => {
                const providers = group.providers.filter((provider) => provider.key.toLowerCase()
                    .includes(this.search) ||
                        provider.config.name.toLowerCase()
                            .includes(this.search));

                return {
                    ...group,
                    providers,
                };
            })
                .filter((group) => group.providers.length > 0);
        } else {
            this.groupsOfProvidersFiltered = this.groupsOfProviders;
        }
    }
}
