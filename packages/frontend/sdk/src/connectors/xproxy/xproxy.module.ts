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
import { ConnectorXProxyComponent } from './connector/connector.component';
import { CredentialXProxyComponent } from './credential/credential.component';
import { ConnectorXProxyFactory } from './xproxy.factory';
import { FingerprintModule } from '../../fingerprint';
import { ConnectorprovidersModule } from '../providers.module';


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
