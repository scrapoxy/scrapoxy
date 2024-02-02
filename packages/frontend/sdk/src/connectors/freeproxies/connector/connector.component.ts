import {
    Component,
    Inject,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
} from '@angular/forms';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    EventsFreeproxiesClient,
    FreeproxiesCreatedEvent,
    FreeproxiesRemovedEvent,
    parseFreeproxy,
} from '@scrapoxy/common';
import { Subscription } from 'rxjs';
import { CommanderFrontendClientService } from '../../../clients';
import { ConfirmService } from '../../../confirm';
import { EventsService } from '../../../events';
import { ToastsService } from '../../../toasts';
import type { IConnectorComponent } from '../../providers.interface';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    ICommanderFrontendClient,
    IFreeproxiesToRemoveOptions,
    IFreeproxy,
    IFreeproxyBase,
} from '@scrapoxy/common';


const ITEMS_PER_PAGE = 15;


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

    pageCurrent = 0;

    pageMax = 0;

    readonly subForm: FormGroup;

    freeproxiesAdd = '';

    private readonly subscription = new Subscription();

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly confirmService: ConfirmService,
        private readonly events: EventsService,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({});

        this.client = new EventsFreeproxiesClient(
            this.events,
            () => {
                this.onFreeproxiesRefreshed();
            },
            () => {
                this.onFreeproxiesRefreshed();
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
                        'Free proxies',
                        `${created.freeproxies.length} proxies added.`
                    );

                    break;
                }

                case FreeproxiesRemovedEvent.id: {
                    const removed = event as FreeproxiesRemovedEvent;
                    this.toastsService.success(
                        'Free proxies',
                        `${removed.freeproxiesIdsRemoved.length} proxies removed.`
                    );

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
            return;
        }

        try {
            const freeproxies = await this.commander.getAllProjectFreeproxiesById(
                this.projectId,
                this.connectorId as string
            );

            this.client.subscribe(
                this.projectId,
                this.connectorId as string,
                freeproxies
            );

            this.onFreeproxiesRefreshed();
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Free proxies',
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

    get freeproxies(): IFreeproxy[] {
        if (!this.client) {
            return [];
        }

        const start = this.pageCurrent * ITEMS_PER_PAGE;

        return this.client.freeproxies.slice(
            start,
            start + ITEMS_PER_PAGE
        );
    }

    async addFreeproxies() {
        if (!this.freeproxiesAdd ||
            this.freeproxiesAdd.length <= 0) {
            return;
        }

        const freeproxies = this.freeproxiesAdd.split(/[\n,]/)
            .map(l => l.trim())
            .map(parseFreeproxy)
            .filter(p => !!p) as IFreeproxyBase[];

        try {
            await this.commander.createFreeproxies(
                this.projectId,
                this.connectorId as string,
                freeproxies
            );

            this.freeproxiesAdd = '';
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Free proxies',
                err.message
            );
        }
    }

    async removeFreeproxyWithConfirm(freeproxy: IFreeproxy): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove freeproxy',
                `Do you want to remove freeproxy ${freeproxy.key} ?`
            );

        if (!accept) {
            return;
        }

        await this.removeFreeproxies({
            ids: [
                freeproxy.id,
            ],
            onlyOffline: false,
        });
    }

    async removeFreeproxiesAllWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove all freeproxies',
                `Do you want to all freeproxies`
            );

        if (!accept) {
            return;
        }

        await this.removeFreeproxies({
            ids: [],
            onlyOffline: false,
        });
    }

    async removeFreeproxiesOfflineWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove offline freeproxies',
                `Do you want to all offline freeproxies`
            );

        if (!accept) {
            return;
        }

        await this.removeFreeproxies({
            ids: [],
            onlyOffline: true,
        });
    }

    private onFreeproxiesRefreshed() {
        this.pageMax = Math.ceil(this.client.freeproxies.length / ITEMS_PER_PAGE);

        this.pageCurrent = Math.max(
            0,
            Math.min(
                this.pageCurrent,
                this.pageMax - 1
            )
        );
    }

    private async removeFreeproxies(options: IFreeproxiesToRemoveOptions): Promise<void> {
        try {
            await this.commander.removeFreeproxies(
                this.projectId,
                this.connectorId as string,
                options
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Free proxies',
                err.message
            );
        }
    }
}
