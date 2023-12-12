import { TaskComponent } from './task/task.component';
import { TasksComponent } from './tasks.component';
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
                component: TasksComponent,
            },
            {
                path: ':taskId',
                component: TaskComponent,
            },
        ],
    },
];
