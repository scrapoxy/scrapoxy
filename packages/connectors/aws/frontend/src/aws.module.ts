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
import { ConnectorAwsFactory } from './aws.factory';
import { ConnectorAwsComponent } from './connector/connector.component';
import { CredentialAwsComponent } from './credential/credential.component';
import { InstallAwsComponent } from './install/install.component';


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
        ConnectorAwsComponent, CredentialAwsComponent, InstallAwsComponent,
    ],
    providers: [
        ConnectorAwsFactory,
    ],
})
export class ConnectorAwsModule {
    constructor(private readonly factory: ConnectorAwsFactory) {
        this.factory.init();
    }
}
