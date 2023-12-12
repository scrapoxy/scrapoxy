import { ProxiesComponent } from './proxies.component';
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
                component: ProxiesComponent,
            },
        ],
    },
];
