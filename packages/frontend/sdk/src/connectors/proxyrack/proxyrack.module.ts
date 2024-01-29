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
import { ConnectorProxyrackComponent } from './connector/connector.component';
import { CredentialProxyrackComponent } from './credential/credential.component';
import { ConnectorProxyrackFactory } from './proxyrack.factory';
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
        ConnectorProxyrackComponent, CredentialProxyrackComponent,
    ],
    providers: [
        ConnectorProxyrackFactory,
    ],
})
export class ConnectorProxyrackModule {
    constructor(private readonly factory: ConnectorProxyrackFactory) {
        this.factory.init();
    }
}
