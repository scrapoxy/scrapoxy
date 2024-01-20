import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorProxyLocalComponent } from './connector/connector.component';
import { CredentialProxyLocalComponent } from './credential/credential.component';
import { ConnectorProxyLocalFactory } from './proxy-local.factory';


@NgModule({
    imports: [
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
        ConnectorProxyLocalComponent, CredentialProxyLocalComponent,
    ],
    providers: [
        ConnectorProxyLocalFactory,
    ],
})
export class ConnectorProxyLocalModule {
    constructor(private readonly factory: ConnectorProxyLocalFactory) {
        this.factory.init();
    }
}
