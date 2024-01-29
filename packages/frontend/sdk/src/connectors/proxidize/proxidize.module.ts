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
import { ConnectorProxidizeComponent } from './connector/connector.component';
import { CredentialProxidizeComponent } from './credential/credential.component';
import { ConnectorProxidizeFactory } from './proxidize.factory';
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
        ConnectorProxidizeComponent, CredentialProxidizeComponent,
    ],
    providers: [
        ConnectorProxidizeFactory,
    ],
})
export class ConnectorProxidizeModule {
    constructor(private readonly factory: ConnectorProxidizeFactory) {
        this.factory.init();
    }
}
