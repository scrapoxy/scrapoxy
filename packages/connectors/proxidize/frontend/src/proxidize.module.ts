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
import { ConnectorProxidizeComponent } from './connector/connector.component';
import { CredentialProxidizeComponent } from './credential/credential.component';
import { ConnectorProxidizeFactory } from './proxidize.factory';


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
