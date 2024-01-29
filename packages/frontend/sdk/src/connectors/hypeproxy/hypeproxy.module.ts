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
import { ConnectorHypeproxyComponent } from './connector/connector.component';
import { CredentialHypeproxyComponent } from './credential/credential.component';
import { ConnectorHypeproxyFactory } from './hypeproxy.factory';
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
        ConnectorHypeproxyComponent, CredentialHypeproxyComponent,
    ],
    providers: [
        ConnectorHypeproxyFactory,
    ],
})
export class ConnectorHypeproxyModule {
    constructor(private readonly factory: ConnectorHypeproxyFactory) {
        this.factory.init();
    }
}
