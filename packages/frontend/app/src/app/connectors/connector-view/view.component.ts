import {
    Component,
    Inject,
    Input,
} from '@angular/core';
import { Router } from '@angular/router';
import {
    CommanderFrontendClientService,
    ConfirmService,
    ConnectorprovidersService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type {
    ICommanderFrontendClient,
    IConnectorView,
    IProjectView,
    IProxyView,
} from '@scrapoxy/common';
import type { IConnectorConfig } from '@scrapoxy/frontend-sdk';


const SCALING_DEBOUNCE = 300;

@Component({
    selector: 'connector-view',
    templateUrl: 'view.component.html',
    styleUrls: [
        'view.component.scss',
    ],
})
export class ConnectorViewComponent {
    @Input()
    project: IProjectView;

    @Input()
    connector: IConnectorView;

    @Input()
    proxies: IProxyView[] = [];

    get proxiesMax(): number {
        if (!this.connector) {
            return -1;
        }

        if (this.scaling !== 0) {
            return Math.max(
                1,
                this.connector.proxiesMax + this.scaling
            );
        } else {
            return this.connector.proxiesMax;
        }
    }

    get config(): IConnectorConfig | undefined {
        if (!this.connector) {
            return;
        }

        const provider = this.connectorproviders.getFactory(this.connector.type);

        return provider.config;
    }

    private scaling = 0;

    private scalingTimeout: ReturnType<typeof setTimeout> | undefined = void 0;

    constructor(
        private readonly connectorproviders: ConnectorprovidersService,
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly confirmService: ConfirmService,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) { }

    activate($event: Event) {
        setTimeout(
            () => {
                (async() => {
                    const oldValue = this.connector.active;
                    const newValue = !oldValue;
                    const target = $event.target as HTMLInputElement;

                    try {
                        target.checked = newValue;

                        await this.commander.activateConnector(
                            this.project.id,
                            this.connector.id,
                            newValue
                        );
                    } catch (err: any) {
                        this.connector.active = oldValue;
                        target.checked = oldValue;

                        console.error(err);

                        this.toastsService.error(
                            'Connector',
                            err.message
                        );
                    }
                })()
                    .catch(err=>{
                        console.error(err);
                    });
            },
            0
        );

        return false;
    }

    async makeDefault(): Promise<void> {
        try {
            await this.commander.setProjectConnectorDefault(
                this.project.id,
                this.connector.id
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector',
                err.message
            );
        }
    }

    async update(): Promise<void> {
        await this.router.navigate([
            '/projects',
            this.project.id,
            'connectors',
            this.connector.id,
            'update',
        ]);
    }

    async scale(): Promise<void> {
        await this.router.navigate([
            '/projects',
            this.project.id,
            'connectors',
            this.connector.id,
            'scale',
        ]);
    }


    async install() {
        await this.router.navigate([
            '/projects',
            this.project.id,
            'connectors',
            this.connector.id,
            'install',
        ]);
    }

    async uninstallWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Uninstall Connector',
                `Do you want to uninstall connector "${this.connector.name}" ?`
            );

        if (!accept) {
            return;
        }

        await this.uninstall();
    }

    async removeWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove Connector',
                `Do you want to remove connector "${this.connector.name}" ?`
            );

        if (!accept) {
            return;
        }

        await this.remove();
    }

    scaleUp() {
        this.scaling++;

        if (this.scalingTimeout) {
            clearTimeout(this.scalingTimeout);
        }

        this.scalingTimeout = setTimeout(
            () => {
                this.updateScaling()
                    .catch(err=>{
                        console.error(err);
                    });
            },
            SCALING_DEBOUNCE
        );
    }

    scaleDown() {
        this.scaling--;

        if (this.scalingTimeout) {
            clearTimeout(this.scalingTimeout);
        }

        this.scalingTimeout = setTimeout(
            () => {
                this.updateScaling()
                    .catch(err=>{
                        console.error(err);
                    });
            },
            SCALING_DEBOUNCE
        );
    }

    private async uninstall(): Promise<void> {
        try {
            const task = await this.commander.uninstallConnector(
                this.project.id,
                this.connector.id
            );

            // Toast already done in project-layout.component.ts

            await this.router.navigate([
                '/projects',
                this.project.id,
                'tasks',
                task.id,
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector',
                err.message
            );
        }
    }

    private async remove(): Promise<void> {
        try {
            await this.commander.removeConnector(
                this.project.id,
                this.connector.id
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector',
                err.message
            );
        }
    }

    private async updateScaling() {
        const newProxiesMax = Math.max(
            1,
            this.connector.proxiesMax + this.scaling
        );

        try {
            if (this.connector.proxiesMax === newProxiesMax) {
                return;
            }

            await this.commander.scaleConnector(
                this.project.id,
                this.connector.id,
                newProxiesMax
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector',
                err.message
            );
        } finally {
            this.scaling = 0;
        }
    }
}
