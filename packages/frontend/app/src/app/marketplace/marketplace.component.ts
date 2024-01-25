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
    EConnectorType,
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


interface ITypeOfConnectors {
    type: string;
    name: string;
    connectors: {
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
    EConnectorType = EConnectorType;

    typesOfConnectorsFiltered: ITypeOfConnectors[] = [];

    projectId: string;

    projectName = '';

    connectorsLoaded = false;

    private readonly typesOfConnectors: ITypeOfConnectors[] = [
        {
            type: EConnectorType.StaticIp,
            name: 'Static IP Providers',
            connectors: [],
        },
        {
            type: EConnectorType.DynamicIP,
            name: 'Dynamic IP Providers',
            connectors: [],
        },
        {
            type: EConnectorType.Hardware,
            name: 'Hardware Providers',
            connectors: [],
        },
        {
            type: EConnectorType.Datacenter,
            name: 'Datacenter Providers',
            connectors: [],
        },
        {
            type: EConnectorType.List,
            name: 'Proxies List',
            connectors: [],
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
                const tcs = this.typesOfConnectors.find((g) => g.type === factory.config.type);

                if (tcs) {
                    tcs.connectors.push({
                        key: factory.type,
                        config: factory.config,
                    });
                } else {
                    console.log(`Type not found for ${factory.type} and type=${factory.config.type}`);
                }
            }

            for (const tcs of this.typesOfConnectors) {
                tcs.connectors.sort((
                    a, b
                ) => a.config.name.localeCompare(b.config.name));
            }

            this.update();

            this.connectorsLoaded = true;
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

    async create(connector: string) {
        await this.router.navigate([
            '/projects',
            this.projectId,
            'credentials',
            'create',
            connector,
        ]);
    }

    private update() {
        if (this.search.length > 0) {
            this.typesOfConnectorsFiltered = this.typesOfConnectors.map((tcs) => {
                const connectors = tcs.connectors.filter((connector) => connector.key.toLowerCase()
                    .includes(this.search) ||
                        connector.config.name.toLowerCase()
                            .includes(this.search));

                return {
                    ...tcs,
                    connectors,
                };
            })
                .filter((tp) => tp.connectors.length > 0);
        } else {
            this.typesOfConnectorsFiltered = this.typesOfConnectors;
        }
    }
}
