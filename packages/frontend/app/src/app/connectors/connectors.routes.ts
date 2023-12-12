import { ConfirmGuard } from '@scrapoxy/frontend-sdk';
import { ConnectorCreateComponent } from './connector/create/create.component';
import { ConnectorInstallComponent } from './connector/install/install.component';
import { ConnectorLayoutComponent } from './connector/layout.component';
import { ConnectorScaleComponent } from './connector/scale/scale.component';
import { ConnectorUpdateComponent } from './connector/update/update.component';
import { ConnectorsComponent } from './connectors.component';
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
                component: ConnectorsComponent,
            },
            {
                path: 'create',
                component: ConnectorCreateComponent,
                canDeactivate: [
                    ConfirmGuard,
                ],
            },
            {
                path: ':connectorId',
                component: ConnectorLayoutComponent,
                children: [
                    {
                        path: '',
                        children: [
                            {
                                path: '',
                                redirectTo: 'update',
                                pathMatch: 'full',
                            },
                            {
                                path: 'install',
                                component: ConnectorInstallComponent,
                                canDeactivate: [
                                    ConfirmGuard,
                                ],
                            },
                            {
                                path: 'update',
                                component: ConnectorUpdateComponent,
                                canDeactivate: [
                                    ConfirmGuard,
                                ],
                            },
                            {
                                path: 'scale',
                                component: ConnectorScaleComponent,
                                canDeactivate: [
                                    ConfirmGuard,
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
];
