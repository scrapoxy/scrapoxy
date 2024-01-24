import { NgModule } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    ButtonModule,
    FormModule,
    GridModule,
    TableModule,
    TooltipModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import {
    ConnectorprovidersModule,
    FingerprintModule,
} from '@scrapoxy/frontend-sdk';
import { ConnectorProxyCheapServerComponent } from './connector/connector.component';
import { CredentialProxyCheapServerComponent } from './credential/credential.component';
import { ConnectorProxyCheapServerFactory } from './pc-server.factory';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FingerprintModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TableModule,
        TooltipModule,
    ],
    declarations: [
        ConnectorProxyCheapServerComponent, CredentialProxyCheapServerComponent,
    ],
    providers: [
        ConnectorProxyCheapServerFactory,
    ],
})
export class ConnectorProxyCheapServerModule {
    constructor(private readonly factory: ConnectorProxyCheapServerFactory) {
        this.factory.init();
    }
}
