import { CallbackComponent } from './callback/callback.component';
import { P404Component } from './error/404.component';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './login/login.component';
import type { Routes } from '@angular/router';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'projects',
        pathMatch: 'full',
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'profile',
                loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
            },
            {
                path: 'projects',
                loadChildren: () => import('./projects/projects.module').then(m => m.ProjectsModule),
            },
        ],
    },
    {
        path: 'callback',
        component: CallbackComponent,
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: '404',
        component: P404Component,
    },
    {
        path: '**', component: P404Component,
    },
];
