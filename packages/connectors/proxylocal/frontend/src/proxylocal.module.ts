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
import { ConnectorProxylocalComponent } from './connector/connector.component';
import { CredentialProxylocalComponent } from './credential/credential.component';
import { ConnectorProxylocalFactory } from './proxylocal.factory';


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
        ConnectorProxylocalComponent, CredentialProxylocalComponent,
    ],
    providers: [
        ConnectorProxylocalFactory,
    ],
})
export class ConnectorProxylocalModule {
    constructor(private readonly factory: ConnectorProxylocalFactory) {
        this.factory.init();
    }
}
