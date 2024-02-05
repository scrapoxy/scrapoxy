import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    AlertModule,
    ButtonModule,
    FormModule,
    GridModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorAzureFactory } from './azure.factory';
import { ConnectorAzureComponent } from './connector/connector.component';
import { CredentialAzureComponent } from './credential/credential.component';
import { InstallAzureComponent } from './install/install.component';


@NgModule({
    imports: [
        AlertModule,
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TooltipModule,
    ],
    declarations: [
        ConnectorAzureComponent, CredentialAzureComponent, InstallAzureComponent,
    ],
    providers: [
        ConnectorAzureFactory,
    ],
})
export class ConnectorAzureModule {
    constructor(private readonly factory: ConnectorAzureFactory) {
        this.factory.init();
    }
}
