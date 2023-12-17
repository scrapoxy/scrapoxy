import { ConfirmGuard } from '@scrapoxy/frontend-sdk';
import { ProjectCreateComponent } from './project/create/create.component';
import { ProjectLayoutComponent } from './project/layout.component';
import { ProjectUpdateComponent } from './project/update/update.component';
import { ProjectsComponent } from './projects.component';
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
                component: ProjectsComponent,
            },
            {
                path: 'create',
                component: ProjectCreateComponent,
                canDeactivate: [
                    ConfirmGuard,
                ],
            },
            {
                path: ':projectId',
                component: ProjectLayoutComponent,
                children: [
                    {
                        path: '',
                        children: [
                            {
                                path: '',
                                redirectTo: 'proxies',
                                pathMatch: 'full',
                            },
                            {
                                path: 'update',
                                component: ProjectUpdateComponent,
                                canDeactivate: [
                                    ConfirmGuard,
                                ],
                            },
                            {
                                path: 'connectors',
                                loadChildren: () => import('../connectors/connectors.module').then(m => m.ConnectorsModule),
                            },
                            {
                                path: 'credentials',
                                loadChildren: () => import('../credentials/credentials.module').then(m => m.CredentialsModule),
                            },
                            {
                                path: 'map',
                                loadChildren: () => import('../map/map.module').then(m => m.MapModule),
                            },
                            {
                                path: 'marketplace',
                                loadChildren: () => import('../marketplace/marketplace.module').then(m => m.MarketplaceModule),
                            },
                            {
                                path: 'proxies',
                                loadChildren: () => import('../proxies/proxies.module').then(m => m.ProxiesModule),
                            },
                            {
                                path: 'metrics',
                                loadChildren: () => import('../metrics/metrics.module').then(m => m.MetricsModule),
                            },
                            {
                                path: 'tasks',
                                loadChildren: () => import('../tasks/tasks.module').then(m => m.TasksModule),
                            },
                            {
                                path: 'users',
                                loadChildren: () => import('../users/users.module').then(m => m.UsersModule),
                            },
                        ],
                    },
                ],
            },
        ],
    },
];
