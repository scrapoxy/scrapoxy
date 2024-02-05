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
} from '@coreui/angular';
import { SharedSpxModule } from '@scrapoxy/frontend-sdk';
import { routes } from './profile.routes';
import { ProfileUpdateComponent } from './update/update.component';


@NgModule({
    imports: [
        ButtonModule,
        BreadcrumbModule,
        CardModule,
        CommonModule,
        FormModule,
        FormsModule,
        GridModule,
        ReactiveFormsModule,
        RouterModule,
        SharedSpxModule,
    ],
    declarations: [
        ProfileUpdateComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class ProfileModule { }
