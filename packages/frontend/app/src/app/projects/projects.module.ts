import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    provideRouter,
    RouterModule,
} from '@angular/router';
import {
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    FormModule,
    GridModule,
    TableModule,
    TooltipModule,
    UtilitiesModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ProjectCreateComponent } from './project/create/create.component';
import { ProjectLayoutComponent } from './project/layout.component';
import { ProjectUpdateComponent } from './project/update/update.component';
import { ProjectViewComponent } from './project-view/view.component';
import { ProjectsComponent } from './projects.component';
import { routes } from './projects.routes';
import { SharedSpxModule } from '../sharedspx/sharedspx.module';


@NgModule({
    imports: [
        BreadcrumbModule,
        ButtonModule,
        CardModule,
        CommonModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        RouterModule,
        SharedSpxModule,
        TableModule,
        TooltipModule,
        UtilitiesModule,
    ],
    declarations: [
        ProjectCreateComponent,
        ProjectLayoutComponent,
        ProjectUpdateComponent,
        ProjectViewComponent,
        ProjectsComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class ProjectsModule { }
