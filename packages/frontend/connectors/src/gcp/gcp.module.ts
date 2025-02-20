import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonGroupModule,
    ButtonModule,
    FormModule,
    GridModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorGcpComponent } from './connector/connector.component';
import { CredentialGcpComponent } from './credential/credential.component';
import { ConnectorGcpFactory } from './gcp.factory';


@NgModule({
    imports: [
        ButtonModule,
        ButtonGroupModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TooltipModule,
    ],
    declarations: [
        ConnectorGcpComponent, CredentialGcpComponent,
    ],
    providers: [
        ConnectorGcpFactory,
    ],
})
export class ConnectorGcpModule {
    constructor(private readonly factory: ConnectorGcpFactory) {
        this.factory.init();
    }
}
