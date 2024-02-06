import {
    Component,
    Inject,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    EventsFreeproxiesClient,
    FreeproxiesCreatedEvent,
    FreeproxiesSynchronizedEvent,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    EventsService,
    ToastsService,
    ValidatorOptionalNumber,
} from '@scrapoxy/frontend-sdk';
import { Subscription } from 'rxjs';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    ICommanderFrontendClient,
    IFreeproxiesToRemoveOptions,
    IFreeproxy,
    IFreeproxyBase,
    ISource,
    ISourcesToRemoveOptions,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_FREEPROXIES_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorFreeproxiesComponent implements IConnectorComponent, OnInit, OnDestroy {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    connectorId: string | undefined;

    @Input()
    credentialId: string;

    @Input()
    createMode: boolean;

    readonly client: EventsFreeproxiesClient;

    readonly subForm: FormGroup;

    freeproxies: IFreeproxy[] = [];

    sources: ISource[] = [];

    private readonly subscription = new Subscription();

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly events: EventsService,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            freeproxiesTimeoutDisconnected: [
                void 0,
                [
                    Validators.required, Validators.min(500), Validators.max(30 * ONE_SECOND_IN_MS),
                ],
            ],
            freeproxiesTimeoutUnreachable: [
                void 0,
                [
                    Validators.required,
                    ValidatorOptionalNumber({
                        min: 500,
                    }),
                ],
            ],
        });

        this.client = new EventsFreeproxiesClient(
            this.events,
            () => {
                this.freeproxies = this.client.freeproxies;
            },
            () => {
                this.freeproxies = this.client.freeproxies;
            }
        );
    }

    async ngOnInit(): Promise<void> {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case FreeproxiesCreatedEvent.id: {
                    const created = event as FreeproxiesCreatedEvent;
                    this.toastsService.success(
                        'Proxy List',
                        `${created.freeproxies.length} proxies added.`
                    );

                    break;
                }

                case FreeproxiesSynchronizedEvent.id: {
                    const sync = event as FreeproxiesSynchronizedEvent;

                    if (sync.actions.removed.length > 0) {
                        this.toastsService.success(
                            'Proxy List',
                            `${sync.actions.removed.length} proxies removed.`
                        );
                    }

                    break;
                }
            }
        }));

        await Promise.resolve();

        if (this.form.get('config')) {
            this.form.removeControl('config');
        }

        this.form.addControl(
            'config',
            this.subForm
        );

        if (this.createMode) {
            this.subForm.patchValue({
                freeproxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
                freeproxiesTimeoutUnreachable: {
                    enabled: true,
                    value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                },
            });

            return;
        }

        try {
            this.freeproxies = await this.commander.getAllProjectFreeproxiesById(
                this.projectId,
                this.connectorId as string
            );

            this.client.subscribe(
                this.projectId,
                this.connectorId as string,
                this.freeproxies
            );

            this.freeproxies$.next(this.client.freeproxies);
            this.freeproxiesSize = sourcesAndFreeproxies.freeproxies.length;
            this.sources$.next(this.client.sources);
            this.sourcesSize = sourcesAndFreeproxies.sources.length;
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Proxy List',
                err.message
            );
        }
    }

    ngOnDestroy() {
        if (this.client) {
            this.client.unsubscribe();
        }

        this.subscription.unsubscribe();
    }

    addSource(source: ISource) {
        this.sources.push(source);

        this.sources = this.sources.sort((
            a, b
        ) => a.url.localeCompare(b.url));
    }

    removeSources(options: ISourcesToRemoveOptions) {
        if (options.urls.length === 0) {
            this.sources = [];

            return;
        }

        this.sources = this.sources.filter((source) => !options.urls.includes(source.url));
    }

    async addFreeproxies(freeproxies: IFreeproxyBase[]) {
        try {
            await this.commander.createFreeproxies(
                this.projectId,
                this.connectorId as string,
                freeproxies
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Proxy List',
                err.message
            );
        }
    }

    async removeFreeproxies(options: IFreeproxiesToRemoveOptions): Promise<void> {
        try {
            await this.commander.removeFreeproxies(
                this.projectId,
                this.connectorId as string,
                options
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Proxy List',
                err.message
            );
        }
    }
}
