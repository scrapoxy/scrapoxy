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
import { ConnectorXProxyComponent } from './connector/connector.component';
import { CredentialXProxyComponent } from './credential/credential.component';
import { ConnectorXProxyFactory } from './xproxy.factory';


@NgModule({
    imports: [
        ButtonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        TableModule,
        TooltipModule,
        ReactiveFormsModule,
        FingerprintModule,
    ],
    declarations: [
        ConnectorXProxyComponent, CredentialXProxyComponent,
    ],
    providers: [
        ConnectorXProxyFactory,
    ],
})
export class ConnectorXProxyModule {
    constructor(private readonly factory: ConnectorXProxyFactory) {
        this.factory.init();
    }
}
