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
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    FormModule,
    GridModule,
    TableModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import {
    ConnectorprovidersModule,
    SharedSpxModule,
} from '@scrapoxy/frontend-sdk';
import { ConnectorCreateComponent } from './connector/create/create.component';
import { ConnectorInstallComponent } from './connector/install/install.component';
import { ConnectorLayoutComponent } from './connector/layout.component';
import { ConnectorScaleComponent } from './connector/scale/scale.component';
import { ConnectorUpdateComponent } from './connector/update/update.component';
import { ConnectorViewComponent } from './connector-view/view.component';
import { ConnectorsComponent } from './connectors.component';
import { routes } from './connectors.routes';


@NgModule({
    imports: [
        BadgeModule,
        BreadcrumbModule,
        ButtonModule,
        ButtonGroupModule,
        CardModule,
        ConnectorprovidersModule,
        CommonModule,
        DropdownModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        RouterModule,
        SharedSpxModule,
        TableModule,
        TooltipModule,
    ],
    declarations: [
        ConnectorCreateComponent,
        ConnectorInstallComponent,
        ConnectorLayoutComponent,
        ConnectorScaleComponent,
        ConnectorUpdateComponent,
        ConnectorViewComponent,
        ConnectorsComponent,
    ],
    providers: [
        provideRouter(routes),
    ],
})
export class ConnectorsModule { }
