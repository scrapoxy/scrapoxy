import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorDatacenterLocalComponent } from './connector/connector.component';
import { CredentialDatacenterLocalComponent } from './credential/credential.component';
import { ConnectorDatacenterLocalFactory } from './datacenter-local.factory';
import { InstallDatacenterLocalComponent } from './install/install.component';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
    ],
    declarations: [
        ConnectorDatacenterLocalComponent, CredentialDatacenterLocalComponent, InstallDatacenterLocalComponent,
    ],
    providers: [
        ConnectorDatacenterLocalFactory,
    ],
})
export class ConnectorDatacenterLocalModule {
    constructor(private readonly factory: ConnectorDatacenterLocalFactory) {
        this.factory.init();
    }
}
