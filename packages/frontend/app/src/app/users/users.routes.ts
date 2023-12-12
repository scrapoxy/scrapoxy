import { ConfirmGuard } from '@scrapoxy/frontend-sdk';
import { UserAddComponent } from './user-add/add.component';
import { UsersComponent } from './users.component';
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
                component: UsersComponent,
            },
            {
                path: 'add',
                component: UserAddComponent,
                canDeactivate: [
                    ConfirmGuard,
                ],
            },
        ],
    },
];
