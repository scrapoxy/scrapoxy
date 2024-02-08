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
    SourcesCreatedEvent,
    SourcesRemovedEvent,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    EventsService,
    ToastsService,
    ValidatorDelayOptional,
} from '@scrapoxy/frontend-sdk';
import {
    Subject,
    Subscription,
} from 'rxjs';
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
    ISourceBase,
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

    freeproxies$ = new Subject<IFreeproxy[]>();

    freeproxiesSize = 0;

    sources$ = new Subject<ISource[]>();

    sourcesSize = 0;

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
                    ValidatorDelayOptional({
                        min: 500,
                    }),
                ],
            ],
        });

        this.client = new EventsFreeproxiesClient(
            this.events,
            () => {
                this.sources$.next(this.client.sources);
                this.sourcesSize = this.client.sources.length;
            },
            () => {
                this.freeproxies$.next(this.client.freeproxies);
                this.freeproxiesSize = this.client.freeproxies.length;
            }
        );
    }

    async ngOnInit(): Promise<void> {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case SourcesCreatedEvent.id: {
                    const created = event as SourcesCreatedEvent;
                    let message: string;

                    if (created.sources.length > 1) {
                        message = `${created.sources.length} sources added.`;
                    } else {
                        message = '1 source added.';
                    }

                    this.toastsService.success(
                        'Proxy List',
                        message
                    );

                    break;
                }

                case SourcesRemovedEvent.id: {
                    const removed = event as SourcesRemovedEvent;
                    let message: string;

                    if (removed.sources.length > 1) {
                        message = `${removed.sources.length} sources removed.`;
                    } else {
                        message = '1 source removed.';
                    }

                    this.toastsService.success(
                        'Proxy List',
                        message
                    );

                    break;
                }

                case FreeproxiesCreatedEvent.id: {
                    const created = event as FreeproxiesCreatedEvent;
                    let message: string;

                    if (created.freeproxies.length > 1) {
                        message = `${created.freeproxies.length} proxies added.`;
                    } else {
                        message = '1 proxy added.';
                    }

                    this.toastsService.success(
                        'Proxy List',
                        message
                    );

                    break;
                }

                case FreeproxiesSynchronizedEvent.id: {
                    const sync = event as FreeproxiesSynchronizedEvent;

                    if (sync.actions.removed.length > 0) {
                        let message: string;

                        if (sync.actions.removed.length > 1) {
                            message = `${sync.actions.removed.length} proxies removed.`;
                        } else {
                            message = '1 proxy removed.';
                        }

                        this.toastsService.success(
                            'Proxy List',
                            message
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
                    enabled: false,
                    value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                },
            });

            return;
        }

        try {
            const sourcesAndFreeproxies = await this.commander.getAllProjectSourcesAndFreeproxiesById(
                this.projectId,
                this.connectorId as string
            );

            this.freeproxies$.next(sourcesAndFreeproxies.freeproxies);
            this.freeproxiesSize = sourcesAndFreeproxies.freeproxies.length;
            this.sources$.next(sourcesAndFreeproxies.sources);
            this.sourcesSize = sourcesAndFreeproxies.sources.length;

            this.client.subscribe(
                this.projectId,
                this.connectorId as string,
                sourcesAndFreeproxies
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

    async addSources(sources: ISourceBase[]) {
        try {
            await this.commander.createSources(
                this.projectId,
                this.connectorId as string,
                sources
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Proxy List',
                err.message
            );
        }
    }

    async removeSources(ids: string[]) {
        try {
            await this.commander.removeSources(
                this.projectId,
                this.connectorId as string,
                ids
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Proxy List',
                err.message
            );
        }
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
