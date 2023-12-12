import {
    Component,
    Inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    ICredentialToCreateCallback,
} from '@scrapoxy/common';


@Component({
    standalone: true,
    template: '',
})
export class CallbackComponent implements OnInit {
    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {}

    async ngOnInit(): Promise<void> {
        const code = this.getCode();
        const raw = window.localStorage.getItem('credential::create');

        if (!raw || !code) {
            await this.router.navigate([
                '/',
            ]);

            return;
        }

        const credentialToCreate = JSON.parse(raw) as ICredentialToCreateCallback;
        credentialToCreate.config = {
            code,
        };

        try {
            await this.commander.createCredentialCallback(credentialToCreate);

            window.localStorage.removeItem('credential::create');
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Callback',
                err.message
            );
        } finally {
            await this.router.navigate([
                '/projects', credentialToCreate.projectId, 'credentials',
            ]);
        }
    }

    private getCode(): string | undefined {
        const href = window.location.href;
        const ind = href.indexOf('?code=');

        if (ind < 0) {
            return;
        }

        return href.substring(ind + 6);
    }
}



