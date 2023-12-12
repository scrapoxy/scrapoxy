import { MapComponent } from './map.component';
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
                component: MapComponent,
            },
        ],
    },
];
