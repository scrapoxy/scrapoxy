import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
    provideRouter,
    RouterModule,
} from '@angular/router';
import {
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    GridModule,
    ProgressModule,
    TableModule,
    UtilitiesModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { TaskComponent } from './task/task.component';
import { TasksComponent } from './tasks.component';
import { routes } from './tasks.routes';
import { SharedSpxModule } from '../sharedspx/sharedspx.module';


@NgModule({
    imports: [
        BreadcrumbModule,
        ButtonModule,
        CardModule,
        CommonModule,
        GridModule,
        IconModule,
        ProgressModule,
        ReactiveFormsModule,
        RouterModule,
        SharedSpxModule,
        TableModule,
        UtilitiesModule,
    ],
    declarations: [
        TaskComponent, TasksComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class TasksModule { }
