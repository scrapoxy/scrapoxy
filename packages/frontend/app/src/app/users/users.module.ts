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
import { SharedSpxModule } from '@scrapoxy/frontend-sdk';
import { UserAddComponent } from './user-add/add.component';
import { UsersComponent } from './users.component';
import { routes } from './users.routes';


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
        UserAddComponent, UsersComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class UsersModule { }
