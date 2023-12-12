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
import { ConnectorCloudlocalFactory } from './cloudlocal.factory';
import { ConnectorCloudlocalComponent } from './connector/connector.component';
import { CredentialCloudlocalComponent } from './credential/credential.component';
import { InstallCloudlocalComponent } from './install/install.component';


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
        ConnectorCloudlocalComponent, CredentialCloudlocalComponent, InstallCloudlocalComponent,
    ],
    providers: [
        ConnectorCloudlocalFactory,
    ],
})
export class ConnectorCloudlocalModule {
    constructor(private readonly factory: ConnectorCloudlocalFactory) {
        this.factory.init();
    }
}
