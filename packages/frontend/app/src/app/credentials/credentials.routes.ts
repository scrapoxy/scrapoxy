import { ConfirmGuard } from '@scrapoxy/frontend-sdk';
import { CredentialCreateListComponent } from './credential/create/create-list.component';
import { CredentialCreateComponent } from './credential/create/create.component';
import { CredentialLayoutComponent } from './credential/layout.component';
import { CredentialUpdateComponent } from './credential/update/update.component';
import { CredentialsComponent } from './credentials.component';
import type { Routes } from '@angular/router';


export const routes: Routes = [
    {
        path: '',

        children: [
            {
                path: '',
                redirectTo: 'view',
                pathMatch: 'full',
            },
            {
                path: 'view',
                component: CredentialsComponent,
            },
            {
                path: 'create',
                component: CredentialCreateListComponent,
            },
            {
                path: 'create/:connectorType',
                component: CredentialCreateComponent,
                canDeactivate: [
                    ConfirmGuard,
                ],
            },
            {
                path: ':credentialId',
                component: CredentialLayoutComponent,
                children: [
                    {
                        path: '',
                        redirectTo: 'update',
                        pathMatch: 'full',
                    },
                    {
                        path: 'update',
                        component: CredentialUpdateComponent,
                        canDeactivate: [
                            ConfirmGuard,
                        ],
                    },
                ],
            },
        ],
    },
];
