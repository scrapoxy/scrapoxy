import { CommonModule } from '@angular/common';
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
import { ConnectorprovidersModule } from '@scrapoxy/frontend-sdk';
import { ConnectorProxySellerResidentialComponent } from './connector/connector.component';
import { CredentialProxySellerResidentialComponent } from './credential/credential.component';
import { ConnectorProxySellerResidentialFactory } from './ps-residential.factory';


@NgModule({
    imports: [
        ButtonModule,
        CommonModule,
        ConnectorprovidersModule,
        FormModule,
        FormsModule,
        GridModule,
        IconModule,
        ReactiveFormsModule,
        TableModule,
        TooltipModule,
    ],
    declarations: [
        ConnectorProxySellerResidentialComponent, CredentialProxySellerResidentialComponent,
    ],
    providers: [
        ConnectorProxySellerResidentialFactory,
    ],
})
export class ConnectorProxySellerResidentialModule {
    constructor(private readonly factory: ConnectorProxySellerResidentialFactory) {
        this.factory.init();
    }
}
