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
    BadgeModule,
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
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { CredentialCreateComponent } from './credential/create/create.component';
import { CredentialLayoutComponent } from './credential/layout.component';
import { CredentialUpdateComponent } from './credential/update/update.component';
import { CredentialsComponent } from './credentials.component';
import { routes } from './credentials.routes';
import { SharedSpxModule } from '../sharedspx/sharedspx.module';


@NgModule({
    imports: [
        BadgeModule,
        BreadcrumbModule,
        ButtonModule,
        CardModule,
        ConnectorprovidersModule,
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
        CredentialCreateComponent,
        CredentialLayoutComponent,
        CredentialUpdateComponent,
        CredentialsComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class CredentialsModule { }
